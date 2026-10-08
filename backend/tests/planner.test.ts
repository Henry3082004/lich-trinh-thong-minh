import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import { config } from "../src/config";
import { prisma } from "../src/lib/prisma";
import { buildPlan, fallbackDraft, type Prefs, type PlanPlace } from "../src/services/planner";
import { travelMinutes } from "../src/services/travel";

const mk = (id: string, over: Partial<PlanPlace> = {}): PlanPlace => ({
  id, name: `Điểm ${id}`, category: "thien-nhien", kind: "place", description: "", address: null,
  lat: 12.2, lng: 107.6, approxLocation: false, durationMin: 60, months: [], season: null, ...over,
});
const A = mk("a"), B = mk("b", { lat: 12.25, lng: 107.65 }), FOOD = mk("food", { category: "am-thuc", durationMin: 60 });
const FEST = mk("fest", { category: "le-hoi", kind: "festival", months: [3], season: "Tháng 3 âm lịch", durationMin: 180 });
const HOTEL = mk("hotel", { category: "luu-tru" });
const ALL = [A, B, FOOD, FEST, HOTEL];
const prefs: Prefs = { people: 4, kids: 0, startDate: "2027-03-10", startTime: "08:00", days: 2, transport: "o-to", pace: "normal" };
const NOW = new Date("2027-03-01T00:00:00Z");

describe("buildPlan", () => {
  it("bỏ id AI bịa và điểm trùng, giữ mục trong giỏ AI bỏ sót, đánh dấu mục AI thêm", () => {
    const plan = buildPlan(prefs, [A, B], ALL, { days: [{ placeIds: [{ id: "a" }, { id: "khong-co" }, { id: "a" }, { id: "food" }] }, { placeIds: [] }] }, NOW);
    const ids = plan.days.flatMap((d) => d.stops.map((s) => s.placeId));
    expect(ids).toContain("b"); // giỏ có b, AI bỏ sót nên được thêm
    expect(ids).not.toContain("khong-co");
    expect(ids.filter((i) => i === "a")).toHaveLength(1);
    const food = plan.days[0].stops.find((s) => s.placeId === "food")!;
    expect(food.suggested).toBe(true);
    expect(plan.days.flatMap((d) => d.stops).find((s) => s.placeId === "a")!.suggested).toBe(false);
  });

  it("giờ do code tính: điểm đầu đúng giờ bắt đầu, các điểm sau cộng thời lượng + di chuyển", () => {
    const plan = buildPlan(prefs, [A, B], ALL, { days: [{ placeIds: [{ id: "a" }, { id: "b" }] }, { placeIds: [] }] }, NOW);
    const [s1, s2] = plan.days[0].stops;
    expect(s1.startTime).toBe("08:00");
    const travel = travelMinutes(A, B, "o-to");
    expect(s2.travelMinFromPrev).toBe(travel);
    const [h, m] = s2.startTime.split(":").map(Number);
    expect(h * 60 + m).toBe(8 * 60 + 60 + travel);
    expect(plan.days[1].date).toBe("2027-03-11");
  });

  it("điểm chưa có vị trí chính xác dùng thời gian ước lượng chung, không dựa vào khoảng cách", () => {
    const X = mk("x", { approxLocation: true });
    expect(travelMinutes(A, X, "o-to")).toBe(15);
    expect(travelMinutes(X, A, "xe-khach")).toBe(30);
    expect(travelMinutes(X, X, "xe-may")).toBe(15);
    const plan = buildPlan({ ...prefs, days: 1 }, [A, X], [A, X], { days: [{ placeIds: [{ id: "a" }, { id: "x" }] }] }, NOW);
    expect(plan.days[0].stops[1].travelMinFromPrev).toBe(15);
  });

  it("xe khách đi lâu hơn ô tô; xe máy chậm hơn ô tô", () => {
    const far = { lat: 12.4, lng: 107.8 };
    expect(travelMinutes(A, far, "xe-khach")).toBeGreaterThan(travelMinutes(A, far, "xe-may"));
    expect(travelMinutes(A, far, "xe-may")).toBeGreaterThan(travelMinutes(A, far, "o-to"));
    const plan = buildPlan({ ...prefs, transport: "xe-khach" }, [A], ALL, { days: [{ placeIds: [{ id: "a" }] }, { placeIds: [] }] }, NOW);
    expect(plan.warnings.join(" ")).toContain("xe khách");
  });

  it("lễ hội không trùng tháng đi thì không xếp vào lịch và báo rõ; trùng tháng thì xếp", () => {
    const out = buildPlan({ ...prefs, startDate: "2027-06-10" }, [FEST, A], ALL, { days: [{ placeIds: [{ id: "fest" }, { id: "a" }] }, { placeIds: [] }] }, NOW);
    expect(out.days.flatMap((d) => d.stops.map((s) => s.placeId))).not.toContain("fest");
    expect(out.warnings.join(" ")).toContain("tháng 3");
    const ok = buildPlan(prefs, [FEST], ALL, { days: [{ placeIds: [{ id: "fest" }] }, { placeIds: [] }] }, NOW);
    expect(ok.days[0].stops.map((s) => s.placeId)).toEqual(["fest"]);
  });

  it("bữa ăn được đặt vào vị trí có giờ gần 12:00 nhất", () => {
    const S1 = mk("s1", { durationMin: 120 }), S2 = mk("s2", { durationMin: 120 }), S3 = mk("s3", { durationMin: 120 });
    const all = [S1, S2, S3, FOOD];
    // AI xếp quán ăn cuối ngày: sau 3 điểm 2 giờ thì đã quá trưa rất xa
    const plan = buildPlan({ ...prefs, days: 1 }, [S1, S2, S3, FOOD], all, { days: [{ placeIds: ["s1", "s2", "s3", "food"].map((id) => ({ id })) }] }, NOW);
    const stops = plan.days[0].stops;
    // Các điểm cùng toạ độ (không tốn thời gian đi): 08:00 và 10:00 mỗi điểm 2 giờ, nên bữa ăn vào đúng 12:00
    expect(stops.map((s) => s.placeId)).toEqual(["s1", "s2", "food", "s3"]);
    expect(stops[2].startTime).toBe("12:00");
  });

  it("lưu trú không thành điểm dừng mà đi vào lodgingIds", () => {
    const plan = buildPlan(prefs, [A, HOTEL], ALL, { days: [{ placeIds: [{ id: "a" }, { id: "hotel" }] }, { placeIds: [] }] }, NOW);
    expect(plan.lodgingIds).toEqual(["hotel"]);
    expect(plan.days.flatMap((d) => d.stops.map((s) => s.placeId))).not.toContain("hotel");
  });

  it("đi hôm nay thì bắt đầu từ giờ hiện tại (giờ VN) nếu đã quá giờ dự định", () => {
    const at = new Date("2027-03-10T05:07:00Z"); // 12:07 giờ VN
    const plan = buildPlan({ ...prefs, startDate: "2027-03-10" }, [A], ALL, { days: [{ placeIds: [{ id: "a" }] }, { placeIds: [] }] }, at);
    expect(plan.days[0].stops[0].startTime).toBe("12:15");
    expect(plan.days[1].stops).toEqual([]);
  });

  it("cảnh báo khi một ngày kết thúc quá muộn", () => {
    const long = [1, 2, 3, 4, 5, 6].map((i) => mk(`l${i}`, { durationMin: 180 }));
    const plan = buildPlan({ ...prefs, days: 1 }, long, long, { days: [{ placeIds: long.map((p) => ({ id: p.id })) }] }, NOW);
    expect(plan.warnings.join(" ")).toContain("muộn");
  });
});

describe("fallbackDraft", () => {
  it("giỏ có mục thì chia đều cho các ngày, mỗi mục một lần", () => {
    const d = fallbackDraft(prefs, [A, B, FOOD], ALL);
    expect(d.days).toHaveLength(2);
    expect(d.days.flatMap((x) => x.placeIds.map((p) => p.id)).sort()).toEqual(["a", "b", "food"]);
  });
});

// ---- API ----
const app = createApp();
const alice = { "X-Dev-User": "alice-plan" };
const body = { prefs: { ...prefs, startDate: "2099-03-10" } };
const gemini = (obj: unknown) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] }), { status: 200 });
let ids: Record<string, string> = {};

beforeAll(async () => {
  await prisma.cartItem.deleteMany();
  await prisma.place.deleteMany();
  for (const p of [A, B, FOOD]) {
    const row = await prisma.place.create({ data: { slug: `pl-${p.id}`, name: p.name, category: p.category, description: "t", images: [], lat: p.lat, lng: p.lng, durationMin: p.durationMin } });
    ids[p.id] = row.id;
  }
});
beforeEach(async () => {
  config.geminiApiKey = "gem-test";
  await prisma.cartItem.deleteMany();
});
afterEach(() => {
  vi.unstubAllGlobals();
  config.geminiApiKey = "";
});
afterAll(() => prisma.$disconnect());

describe("POST /api/plan", () => {
  it("cần đăng nhập và kiểm tra đầu vào", async () => {
    expect((await request(app).post("/api/plan").send(body)).status).toBe(401);
    expect((await request(app).post("/api/plan").set(alice).send({ prefs: { ...body.prefs, days: 9 } })).status).toBe(400);
    expect((await request(app).post("/api/plan").set(alice).send({ prefs: { ...body.prefs, transport: "may-bay" } })).status).toBe(400);
  });

  it("AI sắp xếp giỏ: trả lịch có giờ do code tính, lời tóm tắt, câu hỏi, kèm thông tin điểm", async () => {
    await request(app).post("/api/cart").set(alice).send({ placeId: ids.a });
    await request(app).post("/api/cart").set(alice).send({ placeId: ids.b });
    const fetchMock = vi.fn().mockResolvedValue(gemini({ summary: "Lịch 2 ngày gọn gàng.", questions: ["Bạn muốn thêm cà phê tối không?"], days: [{ stops: [{ placeId: ids.a, note: "đi sớm" }, { placeId: ids.food }] }, { stops: [{ placeId: ids.b }] }] }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await request(app).post("/api/plan").set(alice).send(body);
    expect(res.status).toBe(200);
    expect(res.body.usedAi).toBe(true);
    expect(res.body.summary).toBe("Lịch 2 ngày gọn gàng.");
    expect(res.body.questions).toHaveLength(1);
    expect(res.body.days[0].stops.map((s: { placeId: string }) => s.placeId)).toEqual([ids.a, ids.food]);
    expect(res.body.days[0].stops[0]).toMatchObject({ startTime: "08:00", note: "đi sớm", suggested: false });
    expect(res.body.days[0].stops[1].suggested).toBe(true); // quán ăn do AI thêm, không có trong giỏ
    expect(res.body.places.map((p: { id: string }) => p.id).sort()).toEqual([ids.a, ids.b, ids.food].sort());
    // Lời nhắc gửi đi có thông tin chuyến đi và giỏ
    const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sent.systemInstruction.parts[0].text).toContain("4 người");
    expect(sent.systemInstruction.parts[0].text).toContain("ô tô");
    expect(sent.systemInstruction.parts[0].text).toContain(ids.a);
    expect(sent.generationConfig.responseMimeType).toBe("application/json");
  });

  it("AI lỗi hoặc chưa bật khoá thì dùng lịch dự phòng, vẫn có đủ mục trong giỏ", async () => {
    await request(app).post("/api/cart").set(alice).send({ placeId: ids.a });
    await request(app).post("/api/cart").set(alice).send({ placeId: ids.b });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 400 })));
    const res = await request(app).post("/api/plan").set(alice).send(body);
    expect(res.status).toBe(200);
    expect(res.body.usedAi).toBe(false);
    expect(res.body.days.flatMap((d: { stops: { placeId: string }[] }) => d.stops.map((s) => s.placeId)).sort()).toEqual([ids.a, ids.b].sort());
    config.geminiApiKey = "";
    expect((await request(app).post("/api/plan").set(alice).send(body)).body.usedAi).toBe(false);
  });
});

describe("POST /api/plan/revise", () => {
  const plan = { days: [{ stops: [{ placeId: "x" }] }, { stops: [] }] };

  it("gửi lịch hiện tại + yêu cầu của khách, trả lịch mới đã kiểm tra lại", async () => {
    const fetchMock = vi.fn().mockResolvedValue(gemini({ summary: "Đã thêm quán ăn.", days: [{ stops: [{ placeId: ids.a }, { placeId: "bịa" }] }, { stops: [{ placeId: ids.food }] }] }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await request(app).post("/api/plan/revise").set(alice).send({ ...body, plan: { days: [{ stops: [{ placeId: ids.a }] }, { stops: [] }] }, message: "thêm quán ăn ngày 2" });
    expect(res.status).toBe(200);
    expect(res.body.summary).toBe("Đã thêm quán ăn.");
    expect(res.body.days[0].stops.map((s: { placeId: string }) => s.placeId)).toEqual([ids.a]); // id bịa bị bỏ
    expect(res.body.days[1].stops.map((s: { placeId: string }) => s.placeId)).toEqual([ids.food]);
    const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sent.systemInstruction.parts[0].text).toContain("LỊCH HIỆN TẠI");
    expect(sent.contents[0].parts[0].text).toBe("thêm quán ăn ngày 2");
  });

  it("kiểm tra đầu vào; AI trả rác thì 502; chưa có khoá thì 503", async () => {
    expect((await request(app).post("/api/plan/revise").set(alice).send({ ...body, plan, message: "" })).status).toBe(400);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "không phải json" }] } }] }), { status: 200 })));
    expect((await request(app).post("/api/plan/revise").set(alice).send({ ...body, plan, message: "đổi" })).status).toBe(502);
    config.geminiApiKey = "";
    expect((await request(app).post("/api/plan/revise").set(alice).send({ ...body, plan, message: "đổi" })).status).toBe(503);
  });
});
