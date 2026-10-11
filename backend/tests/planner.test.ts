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
// Các điểm tham quan (bỏ bữa ăn do code tự thêm)
const visits = (d: { stops: { placeId: string; meal: string | null }[] }) => d.stops.filter((s) => !s.meal).map((s) => s.placeId);

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
    const plan = buildPlan(prefs, [A, B], [A, B], { days: [{ placeIds: [{ id: "a" }, { id: "b" }] }, { placeIds: [] }] }, NOW);
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
    expect(visits(ok.days[0])).toEqual(["fest"]);
  });

  it("mỗi ngày đủ bữa sáng, trưa, tối đúng khung giờ; không lặp quán trong ngày", () => {
    const S1 = mk("s1", { durationMin: 120 }), S2 = mk("s2", { durationMin: 120 }), S3 = mk("s3", { durationMin: 120 });
    const R = ["r1", "r2", "r3"].map((id) => mk(id, { category: "am-thuc" }));
    const all = [S1, S2, S3, ...R];
    const plan = buildPlan(prefs, [S1, S2, S3], all, { days: [{ placeIds: ["s1", "s2", "s3"].map((id) => ({ id })) }, { placeIds: [] }] }, NOW);
    const min = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    for (const d of plan.days) {
      const meals = d.stops.filter((s) => s.meal);
      expect(meals.map((s) => s.meal)).toEqual(["sang", "trua", "toi"]);
      const at = (m: string) => min(meals.find((s) => s.meal === m)!.startTime);
      expect(at("sang")).toBeLessThanOrEqual(9 * 60);
      expect(at("trua")).toBeGreaterThanOrEqual(11 * 60);
      expect(at("trua")).toBeLessThanOrEqual(13 * 60 + 30);
      expect(at("toi")).toBeGreaterThanOrEqual(17 * 60 + 30);
      expect(new Set(meals.map((s) => s.placeId)).size).toBe(3);
      expect(meals.every((s) => s.note?.startsWith("Ăn"))).toBe(true);
    }
    expect(visits(plan.days[0])).toEqual(["s1", "s2", "s3"]);
    expect(plan.days[1].stops[0].startTime).toBe("07:00"); // ngày sau mở đầu bằng bữa sáng
  });

  it("khởi hành buổi chiều thì ngày đầu chỉ còn bữa tối; ít quán thì dùng lại quán ở ngày khác", () => {
    const one = mk("r1", { category: "am-thuc" });
    const plan = buildPlan({ ...prefs, startTime: "14:00" }, [A], [A, one], { days: [{ placeIds: [{ id: "a" }] }, { placeIds: [] }] }, NOW);
    expect(plan.days[0].stops.filter((s) => s.meal).map((s) => s.meal)).toEqual(["toi"]);
    expect(plan.days[1].stops.filter((s) => s.meal).length).toBeGreaterThan(0); // quán r1 dùng lại ngày 2
  });

  it("quán khách/AI đã chọn được dùng cho bữa ăn theo ghi chú hoặc vị trí", () => {
    const R = ["r1", "r2"].map((id) => mk(id, { category: "am-thuc" }));
    const plan = buildPlan({ ...prefs, days: 1 }, [A, FOOD], [A, FOOD, ...R], { days: [{ placeIds: [{ id: "a" }, { id: "food", note: "Ăn tối" }] }] }, NOW);
    expect(plan.days[0].stops.find((s) => s.placeId === "food")!.meal).toBe("toi");
    expect(plan.days[0].stops.at(-1)!.placeId).toBe("food");
  });

  it("lưu trú không thành điểm dừng mà đi vào lodgingIds", () => {
    const plan = buildPlan(prefs, [A, HOTEL], ALL, { days: [{ placeIds: [{ id: "a" }, { id: "hotel" }] }, { placeIds: [] }] }, NOW);
    expect(plan.lodgingIds).toEqual(["hotel"]);
    expect(plan.days.flatMap((d) => d.stops.map((s) => s.placeId))).not.toContain("hotel");
  });

  it("ngày đầu bắt đầu theo giờ khách chọn, không theo giờ hiện tại", () => {
    const at = new Date("2027-03-10T05:07:00Z"); // 12:07 giờ VN
    const plan = buildPlan({ ...prefs, startDate: "2027-03-10" }, [A], ALL, { days: [{ placeIds: [{ id: "a" }] }, { placeIds: [] }] }, at);
    expect(plan.days[0].stops[0].startTime).toBe("08:00");
  });

  it("ngày quá dày thì dời điểm dư sang ngày sau; ngày cuối thì bỏ điểm AI gợi ý thêm", () => {
    const long = [1, 2, 3, 4, 5, 6].map((i) => mk(`x${i}`, { durationMin: 180 }));
    const plan = buildPlan(prefs, [], long, { days: [{ placeIds: long.map((p) => ({ id: p.id })) }, { placeIds: [] }] }, NOW);
    for (const d of plan.days) for (const s of d.stops) expect(Number(s.startTime.slice(0, 2))).toBeLessThan(21);
    expect(plan.days[1].stops.length).toBeGreaterThan(0);
    const one = buildPlan({ ...prefs, days: 1 }, [], long, { days: [{ placeIds: long.map((p) => ({ id: p.id })) }] }, NOW);
    expect(one.days[0].stops.every((s) => Number(s.startTime.slice(0, 2)) < 21)).toBe(true);
    expect(one.warnings.join(" ")).toContain("bớt");
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

  it("giỏ ít điểm thì gợi ý thêm điểm gần đó cho đủ mỗi ngày, không thêm lưu trú/lễ hội", () => {
    const extra = [mk("x1", { lat: 12.21, lng: 107.61 }), mk("x2", { lat: 12.22, lng: 107.6 }), mk("x3", { lat: 12.6, lng: 107.9 }), mk("x4", { lat: 12.23, lng: 107.62 }), mk("x5", { lat: 12.24, lng: 107.63 }), mk("x6", { lat: 12.2, lng: 107.64 }), mk("x7", { lat: 12.19, lng: 107.6 })];
    const d = fallbackDraft(prefs, [A], [...ALL, ...extra]);
    const all = d.days.flatMap((x) => x.placeIds.map((p) => p.id));
    expect(all).toContain("a");
    expect(all).not.toContain("hotel");
    expect(all).not.toContain("fest");
    expect(d.days.every((x) => x.placeIds.length === 3)).toBe(true); // nhịp vừa: 3 điểm tham quan, bữa ăn do buildPlan thêm
    expect(all).not.toContain("food");
    expect(new Set(all).size).toBe(all.length);
  });

  it("gợi ý thêm không dồn quán ăn/cà phê: mỗi ngày tối đa một bữa ăn và một quán cà phê", () => {
    const eat = ["e1", "e2", "e3"].map((id) => mk(id, { category: "am-thuc", lat: 12.2, lng: 107.6 }));
    const cafe = ["c1", "c2", "c3"].map((id) => mk(id, { category: "ca-phe", lat: 12.2, lng: 107.6 }));
    const sights = ["s1", "s2", "s3", "s4"].map((id, i) => mk(id, { lat: 12.3 + i * 0.01, lng: 107.7 }));
    const d = fallbackDraft(prefs, [A], [A, ...eat, ...cafe, ...sights]);
    const cat = new Map([A, ...eat, ...cafe, ...sights].map((p) => [p.id, p.category]));
    for (const day of d.days) {
      const cats = day.placeIds.map((p) => cat.get(p.id));
      expect(cats.filter((c) => c === "am-thuc").length).toBeLessThanOrEqual(1);
      expect(cats.filter((c) => c === "ca-phe").length).toBeLessThanOrEqual(1);
    }
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
    expect(res.body.days[0].stops[0]).toMatchObject({ startTime: "08:00", note: "đi sớm", suggested: false, meal: null });
    // quán ăn AI xếp sau điểm tham quan thành bữa trưa (không sớm hơn 11:00), không có trong giỏ
    expect(res.body.days[0].stops[1]).toMatchObject({ suggested: true, meal: "trua", startTime: "11:00" });
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
    const stops = res.body.days.flatMap((d: { stops: { placeId: string; suggested: boolean }[] }) => d.stops);
    expect(stops.map((s: { placeId: string }) => s.placeId)).toEqual(expect.arrayContaining([ids.a, ids.b]));
    // Giỏ ít điểm: lịch dự phòng gợi ý thêm điểm khác (đánh dấu suggested)
    const extra = stops.filter((s: { suggested: boolean }) => s.suggested);
    expect([...new Set(extra.map((s: { placeId: string }) => s.placeId))]).toEqual([ids.food]);
    expect(extra.every((s: { meal: string | null }) => s.meal)).toBe(true); // quán ăn thêm vào làm bữa ăn
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
    expect(visits(res.body.days[0])).toEqual([ids.a]); // id bịa bị bỏ
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
