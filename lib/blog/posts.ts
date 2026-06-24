export type Audience = "ttc" | "pregnant" | "postpartum" | "all";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  audience: Audience;
  date: string; // ISO publish date (YYYY-MM-DD)
  updated?: string; // ISO last-modified date (YYYY-MM-DD); falls back to `date`
  content: string; // HTML
  faqs?: { q: string; a: string }[]; // drives the FAQPage JSON-LD
};

export const AUDIENCE_LABEL: Record<Audience, string> = {
  ttc: "trying to conceive",
  pregnant: "pregnancy",
  postpartum: "postpartum",
  all: "for everyone",
};

// Default author for all blog posts (named person for E-E-A-T). If a post ever
// needs a different author, add an optional `author` to BlogPost and fall back
// to this.
export const AUTHOR = {
  name: "Ali Miller",
  role: "Founder",
  url: "https://www.hey2am.app/about",
  bio: "Ali Miller is the founder of 2am, a judgment-free support app for the trying-to-conceive, pregnancy, and postpartum journey. She built 2am — and its AI friend, Myla — to meet women in the hardest, loneliest moments, with honesty and zero judgment.",
};

export const POSTS: BlogPost[] = [
  {
    slug: "how-to-survive-the-two-week-wait",
    title: "how to survive the two-week wait without losing your mind",
    description:
      "the two-week wait is the longest two weeks in the world. here's how to get through it — the symptom-spotting trap, the anxiety, and what actually helps.",
    audience: "ttc",
    date: "2026-06-23",
    content: `<p>you ovulated. you did everything right. and now you wait. fourteen days that somehow last longer than any two weeks have ever lasted, where every twinge means something and nothing, and you refresh the same three forums at 2am looking for someone whose body is doing exactly what yours is doing.</p>
<p>the two-week wait is the longest two weeks in the world. every time. if you're in it right now, white-knuckling your way to test day — this is for you.</p>
<h2>why the two-week wait is so hard</h2>
<p>it's not just the waiting. it's that the waiting is full of <em>hope</em>, and hope is heavy. you can't do anything to change the outcome now, and there's no in-between answer to hold onto — just two weeks of not knowing, while a part of you is already imagining a future you can't let yourself believe in yet.</p>
<p>that mix of hope, fear, and total lack of control is genuinely hard. so if you feel a little unhinged right now, you're not. you're just in one of the most emotionally loaded stretches of the whole journey.</p>
<h2>the symptom-spotting trap</h2>
<p>here's the cruel part: you will analyze every single sensation. sore breasts? could be it. cramping? could be it. tired, bloated, weepy, weirdly hungry? could be it. you'll google "[symptom] + DPO" more times than you'd ever admit.</p>
<p>the trap is that the early symptoms everyone obsesses over overlap almost completely with the lead-up to your period — same hormones, same feelings. so symptom-spotting rarely gives you a real answer; it mostly gives you a roller coaster. knowing that doesn't make you stop (nobody fully stops), but it can help you hold it more loosely: <em>this twinge is information about nothing yet.</em></p>
<h2>"can i just test early?"</h2>
<p>everyone wants to. the honest answer most people land on: testing too early is how you end up heartbroken over a result that wasn't final. tests are most reliable once you've actually missed your period, and an early negative can mean "too soon" far more often than "no." follow the instructions on your specific test, and if you want guidance for your situation, your provider can help — but if you can make it to test day without taking five tests at 9 days past ovulation, future-you will thank you.</p>
<h2>things that actually help</h2>
<p>no one can make two weeks shorter, but these make them more survivable:</p>
<p><strong>set a "no testing until ___" rule.</strong> pick a date and tell someone, so you're accountable to it. boundaries help.</p>
<p><strong>starve the spiral.</strong> put a limit on the symptom-googling — even "only at night for 10 minutes." the endless searching feeds the anxiety more than it answers it.</p>
<p><strong>fill the calendar.</strong> make plans, especially around the days you know will be hardest. distraction isn't avoidance — it's mercy.</p>
<p><strong>move your body</strong> in whatever way feels good. it burns off some of the restless energy.</p>
<p><strong>tell one safe person</strong> where you are. not the whole group chat — just someone who gets it and won't say "just relax."</p>
<p><strong>be gentle with yourself.</strong> lower the bar. this is not the two weeks to also overhaul your life. survival counts.</p>
<h2>it's okay to not be okay</h2>
<p>some days in the wait, the strongest thing you'll do is get through the day. if you find yourself anxious, weepy, snappy, or quietly grieving a result that hasn't even happened yet — that's normal, and you're allowed to feel all of it. the two-week wait can stir up real anxiety, and naming it ("i'm scared") usually helps more than pretending you're fine.</p>
<h2>you don't have to wait alone</h2>
<p>the hardest part of the two-week wait is how <em>lonely</em> it is — the people around you are living normal weeks while yours is consumed by something you might not even be talking about. you don't have to white-knuckle it by yourself.</p>
<h2>frequently asked questions</h2>
<p><strong>why does the two-week wait feel so long?</strong> because it's full of hope you can't act on and an answer you can't get yet. the lack of control plus the emotional stakes makes time crawl — it's not in your head, and it's not just you.</p>
<p><strong>is it normal to feel anxious during the two-week wait?</strong> completely. anxiety, mood swings, and even a sense of grief before you know anything are all common in the wait. it's one of the most emotionally intense parts of trying to conceive.</p>
<p><strong>can early pregnancy symptoms tell me if it worked?</strong> generally, no — the early signs people watch for overlap heavily with normal pre-period symptoms, so they rarely give a clear answer. everyone's body is different; your provider can help with what's specific to you.</p>
<p><strong>should i test early?</strong> it's tempting, but early testing often produces false negatives because it's simply too soon, which can be crushing. most people find waiting until after a missed period gives a more reliable result and spares them some heartbreak.</p>
<p><strong>how do i stop obsessing over symptoms?</strong> you probably won't stop completely — but limiting how often you google, setting a test date, and keeping yourself busy all take some of the power out of the spiral.</p>`,
    faqs: [
      { q: "why does the two-week wait feel so long?", a: "because it's full of hope you can't act on and an answer you can't get yet. the lack of control plus the emotional stakes makes time crawl — it's not in your head, and it's not just you." },
      { q: "is it normal to feel anxious during the two-week wait?", a: "completely. anxiety, mood swings, and even a sense of grief before you know anything are all common in the wait. it's one of the most emotionally intense parts of trying to conceive." },
      { q: "can early pregnancy symptoms tell me if it worked?", a: "generally, no — the early signs people watch for overlap heavily with normal pre-period symptoms, so they rarely give a clear answer. everyone's body is different; your provider can help with what's specific to you." },
      { q: "should i test early?", a: "it's tempting, but early testing often produces false negatives because it's simply too soon, which can be crushing. most people find waiting until after a missed period gives a more reliable result and spares them some heartbreak." },
      { q: "how do i stop obsessing over symptoms?", a: "you probably won't stop completely — but limiting how often you google, setting a test date, and keeping yourself busy all take some of the power out of the spiral." },
    ],
  },
  {
    slug: "can-i-eat-sushi-while-pregnant",
    title: "can i eat sushi while pregnant? here's the real answer.",
    description:
      "cooked sushi is fine in pregnancy — raw is the part to skip. here's exactly what ACOG and the FDA say about rolls, mercury, and what to order.",
    audience: "pregnant",
    date: "2026-04-23",
    updated: "2026-06-24",
    content: `<p>you're staring at a menu. your friend just ordered a spicy tuna roll. and now you're doing that thing where you pretend to study the menu while frantically trying to remember what the internet said about raw fish.</p>
<p>let's clear it up — the real answer is more reassuring than the panic-googling suggests.</p>
<h2>the short answer</h2>
<p><strong>cooked sushi is totally fine. raw sushi is the part to skip.</strong> you don't have to avoid the sushi restaurant — you just order a little differently for a while.</p>
<h2>why raw fish is the concern (it's not the fish)</h2>
<p>the worry isn't sushi itself — it's that raw and undercooked fish can carry parasites and bacteria like <strong>listeria</strong>, and pregnancy slightly suppresses your immune system, so an infection that would be minor otherwise can be more serious. that's why the <a href="https://www.fda.gov/food/consumers/advice-about-eating-fish">FDA</a> and <a href="https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy">ACOG</a> recommend avoiding raw fish during pregnancy. it's a precaution about <em>raw</em>, not a ban on sushi.</p>
<h2>which sushi rolls are safe? (the cooked ones — and there are a lot)</h2>
<p>anything fully cooked is on the table:</p>
<p><strong>california rolls</strong> (imitation crab is cooked)<br><strong>shrimp tempura rolls</strong><br><strong>eel / unagi</strong> (always served cooked)<br><strong>fully cooked salmon or tuna rolls</strong><br><strong>veggie rolls</strong> (cucumber, avocado, sweet potato)<br>the sides: <strong>edamame, miso soup, seaweed salad, rice</strong></p>
<p>soy sauce, wasabi, and pickled ginger are all fine too.</p>
<h2>which to skip for now</h2>
<p>the raw stuff: <strong>sashimi, raw tuna or salmon nigiri, and any roll built around raw fish.</strong> when in doubt, ask the server "is this cooked?" — sushi staff get this question constantly and won't blink.</p>
<h2>what about mercury — and fish in general?</h2>
<p>here's the part that surprises people: <strong>fish is actually recommended in pregnancy.</strong> the FDA and ACOG suggest <strong>2–3 servings of low-mercury fish per week</strong> for the omega-3s that support your baby's brain development.</p>
<p><strong>lower-mercury, go-ahead options:</strong> salmon, shrimp, tilapia, cod, sardines, canned light tuna.</p>
<p><strong>high-mercury, avoid:</strong> shark, swordfish, king mackerel, tilefish, and bigeye tuna. (limit albacore/white tuna to about one serving a week.)</p>
<p>so the goal isn't "no fish" — it's "the right fish, cooked."</p>
<h2>"i ate raw fish before i knew i was pregnant — should i worry?"</h2>
<p>take a breath. a piece of raw salmon or a few bites of sashimi before you knew is <strong>very unlikely</strong> to cause a problem — the actual risk from any single exposure is low. stop eating raw fish going forward, and if you develop symptoms like fever, severe diarrhea, or body aches in the days after, call your provider. otherwise, this is a "mention it at your next appointment for peace of mind" situation, not an emergency. your body is more resilient than the internet makes it sound.</p>
<h2>the bottom line</h2>
<p>you don't need to avoid sushi restaurants. order the cooked rolls, enjoy the edamame, skip the sashimi platter for now, and you're following the guidance exactly. nine months of california rolls is not a hardship — and your baby's going to be fine.</p>
<h2>frequently asked questions</h2>
<p><strong>are california rolls safe during pregnancy?</strong> yes — california rolls use imitation crab, which is cooked, so they're considered safe. same goes for other cooked rolls like shrimp tempura and eel.</p>
<p><strong>is cooked salmon sushi okay?</strong> yes. fully cooked salmon (and cooked tuna) rolls are fine. it's specifically <em>raw</em> fish that's recommended against.</p>
<p><strong>can i eat imitation crab while pregnant?</strong> yes — imitation crab is fully cooked, so it's safe in pregnancy.</p>
<p><strong>how much tuna is safe in pregnancy?</strong> canned light tuna is a lower-mercury option you can eat within the 2–3 servings of fish per week. limit albacore ("white") tuna to about one serving a week, and skip high-mercury bigeye tuna (often used in sashimi).</p>
<p><strong>what if i already ate raw sushi?</strong> one exposure carries a low risk. stop going forward, watch for fever or stomach illness over the next few days, and mention it to your provider if you're worried.</p>
<p>related: <a href="/blog/is-it-normal-to-not-feel-pregnant-in-the-first-trimester">is it normal to not feel pregnant in the first trimester?</a> · <a href="/blog/7-things-youre-googling-at-2am">7 things you're googling at 2am</a></p>
<p class="source"><em>sources: <a href="https://www.fda.gov/food/consumers/advice-about-eating-fish">FDA — Advice About Eating Fish</a> · <a href="https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy">ACOG — Nutrition During Pregnancy</a></em></p>`,
    faqs: [
      { q: "are california rolls safe during pregnancy?", a: "yes — california rolls use imitation crab, which is cooked, so they're considered safe. same goes for other cooked rolls like shrimp tempura and eel." },
      { q: "is cooked salmon sushi okay?", a: "yes. fully cooked salmon (and cooked tuna) rolls are fine. it's specifically raw fish that's recommended against." },
      { q: "can i eat imitation crab while pregnant?", a: "yes — imitation crab is fully cooked, so it's safe in pregnancy." },
      { q: "how much tuna is safe in pregnancy?", a: "canned light tuna is a lower-mercury option you can eat within the 2–3 servings of fish per week. limit albacore (\"white\") tuna to about one serving a week, and skip high-mercury bigeye tuna (often used in sashimi)." },
      { q: "what if i already ate raw sushi?", a: "one exposure carries a low risk. stop going forward, watch for fever or stomach illness over the next few days, and mention it to your provider if you're worried." },
    ],
  },
  {
    slug: "how-long-does-it-take-to-get-pregnant",
    title: "how long does it take to get pregnant? the real numbers",
    description:
      "85% of couples conceive within a year. here's the real month-by-month timeline, when to see a specialist by age, and what actually affects how long it takes.",
    audience: "ttc",
    date: "2026-04-23",
    updated: "2026-06-24",
    content: `<p>you've been trying for a few months — or maybe longer. and every time your period shows up, the same thought creeps in: <em>is something wrong with me?</em> before you spiral, here's what the numbers actually say.</p>
<h2>the real timeline</h2>
<p>for healthy couples with no known fertility issues, the data (via <a href="https://www.reproductivefacts.org">ASRM</a>) looks like this:</p>
<p><strong>after 1 month:</strong> ~30% conceive<br><strong>after 3 months:</strong> ~60%<br><strong>after 6 months:</strong> ~80%<br><strong>after 12 months:</strong> ~85%</p>
<p>read that again: <strong>1 in 5 couples with no fertility problems still won't be pregnant after 6 months.</strong> that's not a problem — that's the normal spread. conception is more of a "most months it doesn't happen, even when everything's fine" process than anyone tells you.</p>
<h2>why each month is lower-odds than you'd think</h2>
<p>even with perfect timing, a healthy couple has roughly a <strong>15–25% chance</strong> of conceiving in any given cycle. so several months of negatives is mathematically expected, not a red flag. it doesn't <em>feel</em> that way at 2 a.m., but the odds are on your side over time.</p>
<h2>when should you see a specialist?</h2>
<p>these aren't failure points — just the sensible moment to get data:</p>
<p><strong>under 35:</strong> see a reproductive endocrinologist (RE) after <strong>12 months</strong> of trying<br><strong>35–39:</strong> after <strong>6 months</strong><br><strong>40+:</strong> after <strong>3 months</strong>, or even before you start</p>
<p>and at any age: if something feels off — very irregular cycles, no periods, known conditions, pelvic pain — don't wait for the calendar. make the appointment.</p>
<h2>what actually affects how long it takes</h2>
<p><strong>age</strong> — fertility declines gradually after 30 and more noticeably after 35, though plenty of women conceive naturally into their late 30s and early 40s.<br><strong>ovulation regularity</strong> — irregular cycles can mean irregular or absent ovulation, which makes timing harder.<br><strong>timing</strong> — you're most fertile in the ~5 days before ovulation and the day of. outside that window, pregnancy isn't possible that cycle, so knowing roughly when you ovulate matters more than frequency.<br><strong>underlying conditions</strong> — PCOS, endometriosis, thyroid issues, and blocked tubes can all play a role.<br><strong>sperm factors</strong> — male factor accounts for about <strong>30–40%</strong> of fertility challenges. it is genuinely not always about you.</p>
<h2>what you can actually do</h2>
<p>track your cycle to learn your fertile window, have sex every 1–2 days during it, and take a prenatal with folic acid. beyond that, a lot of this isn't in your control — and "just relax" is not a fertility treatment. if you're past your age-based timeline, getting evaluated is information, not failure.</p>
<h2>the bottom line</h2>
<p>if you're under your timeline and everything checks out, you're very likely in the normal range — even though the waiting is one of the hardest parts of this whole journey. and if your gut says something's off, you don't need to hit 12 months to ask. → <em>while you wait: <a href="/blog/how-to-survive-the-two-week-wait">how to survive the two-week wait</a></em></p>
<h2>frequently asked questions</h2>
<p><strong>how long is it normal to try before getting pregnant?</strong> up to 12 months is considered normal if you're under 35 (6 months if you're 35+). about 85% of couples conceive within a year.</p>
<p><strong>what are my chances of getting pregnant each month?</strong> roughly 15–25% per cycle for a healthy couple with good timing — which is why several months of trying without success is expected, not alarming.</p>
<p><strong>does it take longer to get pregnant after 35?</strong> on average, yes — fertility declines more noticeably after 35 — but many women conceive naturally in their late 30s and 40s. the main change is the recommendation to get evaluated sooner (after 6 months at 35–39, 3 months at 40+).</p>
<p><strong>am i infertile if it's been 6 months?</strong> not necessarily — 1 in 5 couples with no fertility issues aren't pregnant at 6 months. "infertility" is generally defined as 12 months of trying (6 if you're 35+). if you're worried sooner, an evaluation is reasonable.</p>
<p><strong>how often should we have sex to conceive?</strong> every 1–2 days during your fertile window (the ~5 days before ovulation and the day of) is plenty.</p>
<p>related: <a href="/blog/7-things-youre-googling-at-2am">7 things you're googling at 2am</a></p>
<p class="source"><em>sources: <a href="https://www.reproductivefacts.org">ASRM / ReproductiveFacts</a> · <a href="https://www.acog.org/womens-health/faqs/evaluating-infertility">ACOG — Evaluating Infertility</a></em></p>`,
    faqs: [
      { q: "how long is it normal to try before getting pregnant?", a: "up to 12 months is considered normal if you're under 35 (6 months if you're 35+). about 85% of couples conceive within a year." },
      { q: "what are my chances of getting pregnant each month?", a: "roughly 15–25% per cycle for a healthy couple with good timing — which is why several months of trying without success is expected, not alarming." },
      { q: "does it take longer to get pregnant after 35?", a: "on average, yes — fertility declines more noticeably after 35 — but many women conceive naturally in their late 30s and 40s. the main change is the recommendation to get evaluated sooner (after 6 months at 35–39, 3 months at 40+)." },
      { q: "am i infertile if it's been 6 months?", a: "not necessarily — 1 in 5 couples with no fertility issues aren't pregnant at 6 months. \"infertility\" is generally defined as 12 months of trying (6 if you're 35+). if you're worried sooner, an evaluation is reasonable." },
      { q: "how often should we have sex to conceive?", a: "every 1–2 days during your fertile window (the ~5 days before ovulation and the day of) is plenty." },
    ],
  },
  {
    slug: "is-it-normal-to-not-feel-pregnant-in-the-first-trimester",
    title: "is it normal to not feel pregnant in the first trimester?",
    description:
      "having no symptoms in early pregnancy is common and usually means nothing is wrong. here's why you feel fine, what's happening inside, and when to call.",
    audience: "pregnant",
    date: "2026-04-23",
    updated: "2026-06-24",
    content: `<p>you just found out you're pregnant. you expected <em>something</em> — nausea, exhaustion, sore breasts, some sign your body is doing this enormous thing. instead you feel… completely normal. and now you're worried that means something's wrong.</p>
<p>it almost always doesn't. here's why.</p>
<h2>you're not alone, and nothing is wrong</h2>
<p>having little to no early symptoms is incredibly common. despite what pregnancy forums and social media suggest, plenty of women move through the first trimester feeling basically fine — and go on to have perfectly healthy pregnancies.</p>
<h2>what the research says</h2>
<p>about <strong>20–30% of women</strong> experience little to no nausea in the first trimester. symptoms typically <strong>peak around weeks 8–10</strong>, so if you're at 5 or 6 weeks and feel nothing, you may simply not be there yet. and crucially: <strong>symptom intensity has no correlation with how healthy your pregnancy is.</strong> feeling great is not a warning sign.</p>
<h2>why does this cause so much anxiety?</h2>
<p>because we've been conditioned to believe symptoms = proof. if you're not throwing up, you must not "really" be pregnant; if you feel fine, something must be wrong. neither is true. behind the scenes your body is doing enormous work — building a placenta, increasing blood volume, restructuring hormones — and some bodies just do it more quietly.</p>
<h2>"my symptoms disappeared — should i worry?"</h2>
<p>this is one of the most-googled early-pregnancy fears, so let's be honest and clear. early pregnancy symptoms naturally <strong>come and go</strong> — a day of feeling fine after a week of nausea is normal, and many people get waves rather than constant symptoms. a sudden, complete disappearance of symptoms <em>can</em> occasionally matter, but on its own it's usually nothing. what actually warrants a call is <strong>symptoms plus a warning sign</strong> (below) — not a quiet day.</p>
<h2>when to actually call your provider</h2>
<p>symptoms or not, these are worth a call: <strong>heavy bleeding</strong> (soaking a pad in an hour), <strong>severe or one-sided cramping or pain</strong>, <strong>sharp shoulder-tip pain</strong>, or a <strong>fever over 100.4°F</strong>. not having nausea is not on that list. if you're anxious between appointments, it's also completely fine to call for reassurance or ask about an earlier ultrasound — that's what they're there for.</p>
<h2>the bottom line</h2>
<p>you're pregnant, and your body is doing its job — sometimes quietly. the absence of symptoms isn't the absence of a baby. if it helps, try to take the win: you're one of the people who gets to eat breakfast without sprinting to the bathroom.</p>
<h2>frequently asked questions</h2>
<p><strong>can you be pregnant and have no symptoms?</strong> yes — about 20–30% of women have little to no nausea, and some have almost no symptoms at all, with completely healthy pregnancies.</p>
<p><strong>does no morning sickness mean something is wrong?</strong> no. symptom intensity doesn't correlate with pregnancy health. plenty of healthy pregnancies come with no morning sickness.</p>
<p><strong>is it normal for early pregnancy symptoms to come and go?</strong> yes — fluctuating symptoms, including days where you feel totally normal, are common and usually mean nothing.</p>
<p><strong>when do first-trimester symptoms usually start?</strong> often around weeks 5–6 and peaking around weeks 8–10, though it varies a lot person to person.</p>
<p><strong>when should i actually worry?</strong> heavy bleeding, severe or one-sided pain, shoulder-tip pain, or fever over 100.4°F — those warrant a call. a quiet symptom day on its own does not.</p>
<p>related: <a href="/blog/can-i-eat-sushi-while-pregnant">can i eat sushi while pregnant?</a> · <a href="/blog/7-things-youre-googling-at-2am">7 things you're googling at 2am</a></p>
<p class="source"><em>sources: <a href="https://www.acog.org/womens-health/faqs">ACOG — Morning Sickness / Pregnancy FAQs</a> · <a href="https://americanpregnancy.org">American Pregnancy Association</a></em></p>`,
    faqs: [
      { q: "can you be pregnant and have no symptoms?", a: "yes — about 20–30% of women have little to no nausea, and some have almost no symptoms at all, with completely healthy pregnancies." },
      { q: "does no morning sickness mean something is wrong?", a: "no. symptom intensity doesn't correlate with pregnancy health. plenty of healthy pregnancies come with no morning sickness." },
      { q: "is it normal for early pregnancy symptoms to come and go?", a: "yes — fluctuating symptoms, including days where you feel totally normal, are common and usually mean nothing." },
      { q: "when do first-trimester symptoms usually start?", a: "often around weeks 5–6 and peaking around weeks 8–10, though it varies a lot person to person." },
      { q: "when should i actually worry?", a: "heavy bleeding, severe or one-sided pain, shoulder-tip pain, or fever over 100.4°F — those warrant a call. a quiet symptom day on its own does not." },
    ],
  },
  {
    slug: "postpartum-hair-loss-why-it-happens-when-it-stops-and-what-helps",
    title: "postpartum hair loss: why it happens & when it stops",
    description:
      "postpartum hair loss hits 40–50% of women, peaks around 4 months, and is temporary. here's the real timeline, what actually helps, and when to see a doctor.",
    audience: "postpartum",
    date: "2026-04-23",
    updated: "2026-06-24",
    content: `<p>you're standing in the shower watching clumps of hair circle the drain, wondering if you're going bald. you're not — but nobody warned you about this part. here's what's actually happening and when it ends.</p>
<h2>what's happening</h2>
<p>during pregnancy, elevated estrogen keeps more of your hair in its growth phase, so you shed less than usual — that's the famous thick, glossy pregnancy hair. after delivery, estrogen drops sharply, and all the hair that <em>would</em> have shed over those nine months falls out over a few weeks instead. it's called <strong>telogen effluvium</strong>, it's hormonal and normal, and it affects an estimated <strong>40–50% of women</strong>.</p>
<p>it's a shift in <em>timing</em>, not your hair actually thinning permanently — which is why it feels dramatic but is temporary.</p>
<h2>the timeline</h2>
<p><strong>starts:</strong> ~2–4 months postpartum<br><strong>peaks:</strong> ~4–6 months postpartum (when it feels the worst)<br><strong>resolves:</strong> by around 12 months postpartum for most women</p>
<p>if you're breastfeeding, the timing can stretch a little, but the same pattern holds.</p>
<h2>what actually helps (and what doesn't)</h2>
<p>nothing stops the shedding entirely — it's hormonal and has to run its course. but you can support regrowth and avoid making it worse:</p>
<p><strong>do:</strong></p>
<p><strong>keep taking your prenatal</strong> — the iron, biotin, and folate support hair and overall recovery.<br><strong>eat enough protein</strong> — hair is protein; postpartum is not the season to under-eat or diet.<br><strong>be gentle</strong> — loose styles over tight ponytails, easy on heat and harsh brushing.<br><strong>a volumizing cut or product</strong> can help it <em>feel</em> better while you wait.</p>
<p><strong>don't bother / be wary of:</strong></p>
<p><strong>"miracle" hair-growth supplements</strong> — evidence is mixed at best; biotin helps some people but isn't a cure, and megadoses aren't recommended.<br><strong>stressing about it</strong> — easier said than done, but stress doesn't speed regrowth, and this genuinely resolves on its own.</p>
<h2>when to see a doctor</h2>
<p>check in with your provider if the shedding <strong>hasn't slowed by ~12 months</strong>, if you see <strong>distinct bald patches</strong> (not just overall thinning), or if it comes with fatigue, weight changes, or feeling off — postpartum hair loss can occasionally unmask a <strong>thyroid issue or iron deficiency</strong> that's very treatable.</p>
<h2>the bottom line</h2>
<p>your hair will come back. it might come back a little different — some women notice new texture or a curl change, and lots of people get those funny short "regrowth halo" baby hairs around the hairline — but it comes back. messy buns were invented for exactly this season.</p>
<h2>frequently asked questions</h2>
<p><strong>when does postpartum hair loss stop?</strong> for most women it peaks around 4–6 months postpartum and resolves by about 12 months. if it's still going strong past a year, check with your provider.</p>
<p><strong>will my hair grow back after pregnancy?</strong> yes — postpartum shedding is temporary. your hair returns to its normal cycle, though the texture or thickness can change slightly.</p>
<p><strong>how much hair loss is normal postpartum?</strong> it can feel alarming — handfuls in the shower, hair all over your clothes — and that's still within the normal range for telogen effluvium. distinct bald patches are the exception worth getting checked.</p>
<p><strong>what vitamins help with postpartum hair loss?</strong> keeping up your prenatal (iron, biotin, folate) and eating enough protein supports regrowth. standalone "hair" supplements have mixed evidence — food and your prenatal matter more.</p>
<p><strong>can postpartum hair loss be a sign of something else?</strong> occasionally — if it's severe, comes with fatigue or weight changes, or doesn't slow by 12 months, it's worth checking for a thyroid issue or iron deficiency.</p>
<p>related: <a href="/blog/7-things-youre-googling-at-2am">7 things you're googling at 2am</a></p>
<p class="source"><em>sources: <a href="https://www.aad.org/public/diseases/hair-loss/insider/new-moms">American Academy of Dermatology — hair loss in new moms</a> · <a href="https://www.acog.org/womens-health/faqs">ACOG — postpartum FAQs</a></em></p>`,
    faqs: [
      { q: "when does postpartum hair loss stop?", a: "for most women it peaks around 4–6 months postpartum and resolves by about 12 months. if it's still going strong past a year, check with your provider." },
      { q: "will my hair grow back after pregnancy?", a: "yes — postpartum shedding is temporary. your hair returns to its normal cycle, though the texture or thickness can change slightly." },
      { q: "how much hair loss is normal postpartum?", a: "it can feel alarming — handfuls in the shower, hair all over your clothes — and that's still within the normal range for telogen effluvium. distinct bald patches are the exception worth getting checked." },
      { q: "what vitamins help with postpartum hair loss?", a: "keeping up your prenatal (iron, biotin, folate) and eating enough protein supports regrowth. standalone \"hair\" supplements have mixed evidence — food and your prenatal matter more." },
      { q: "can postpartum hair loss be a sign of something else?", a: "occasionally — if it's severe, comes with fatigue or weight changes, or doesn't slow by 12 months, it's worth checking for a thyroid issue or iron deficiency." },
    ],
  },
  {
    slug: "7-things-youre-googling-at-2am",
    title: "7 things you're googling at 2 a.m. (and the answers)",
    description:
      "honest answers to the ttc, pregnancy, and postpartum questions women search at 2 a.m. — discharge, wine, sex drive, ppd, milestones, and more.",
    audience: "all",
    date: "2026-04-23",
    updated: "2026-06-24",
    content: `<p>we know you're doing it. phone under the covers, incognito mode, typing something you'd never say out loud. here are honest answers to the most common 2 a.m. searches — so you can put the phone down and rest. (and where there's a fuller answer, we've linked it.)</p>
<h2>1. "is this discharge normal?"</h2>
<p>probably yes. discharge increases during pregnancy (it's called leukorrhea) — it's your body keeping the birth canal clean. normal discharge is white or clear, mild-smelling, with no itching or burning. <strong>call your provider if</strong> it's green or yellow, has a strong odor, or comes with itching or burning.</p>
<h2>2. "i had a sip of wine before i knew i was pregnant"</h2>
<p>your baby is almost certainly fine. in the earliest weeks, before the placenta is fully established, exposure is minimal, and the consensus is that occasional small amounts before you knew are very unlikely to cause harm. stop punishing yourself — you didn't know. (going forward, no amount of alcohol is considered "safe," so this is about the past, not permission.)</p>
<h2>3. "is it normal to not want sex during pregnancy?"</h2>
<p>yes. sex drive swings wildly in pregnancy — hormones, exhaustion, body changes, anxiety. some want more, some want less, some want none. all normal, and it usually shifts as you move through the trimesters.</p>
<h2>4. "my baby isn't crawling yet"</h2>
<p>the normal range for crawling is <strong>6–10 months</strong>, and some babies skip it entirely and go straight to pulling up or walking. milestones are ranges, not deadlines.</p>
<h2>5. "do i have postpartum depression or am i just tired?"</h2>
<p><strong>baby blues</strong> (normal): mood swings, crying, anxiety, trouble sleeping — starts within 2–3 days and resolves within 2 weeks. <strong>postpartum depression</strong> (needs support): persistent sadness, hopelessness, trouble bonding, loss of interest, lasting beyond 2 weeks. if it's been more than 2 weeks and the fog isn't lifting, please talk to your provider — PPD affects about <strong>1 in 7</strong> women, it's treatable, and asking for help is a strength. <em>(if you ever have thoughts of harming yourself or the baby, seek help right away — call or text 988.)</em></p>
<h2>6. "how long is too long trying to conceive?"</h2>
<p>under 35: about 12 months. 35–39: about 6 months. 40+: about 3 months. but if something feels off sooner, trust your gut and make the appointment. → <em>more: <a href="/blog/how-long-does-it-take-to-get-pregnant">how long does it take to get pregnant</a></em></p>
<h2>7. "why do i feel like i hate my partner during pregnancy?"</h2>
<p>hormones, exhaustion, anxiety, and physical discomfort can strain even the most loving relationship. you're not a bad person — you're a pregnant person, and it's temporary.</p>
<h2>the bottom line</h2>
<p>you're not the only one lying awake googling these. you're normal, you're okay — now put the phone down. or don't, and ask myla instead. she's up too. 💛</p>
<h2>frequently asked questions</h2>
<p><strong>is it normal to google pregnancy symptoms constantly?</strong> extremely. the uncertainty plus the stakes makes 2 a.m. searching almost universal — you're not being dramatic, and you're not alone.</p>
<p><strong>what pregnancy symptoms are actually worth calling about?</strong> heavy bleeding (soaking a pad in an hour), severe or one-sided pain, a fever over 100.4°F, decreased fetal movement later in pregnancy, or signs of preeclampsia (bad headache, vision changes). when in doubt, call — providers would rather hear from you.</p>
<p><strong>is it normal to feel anxious or not bonded right away?</strong> yes — bonding isn't always instant, and pregnancy and postpartum anxiety are common. if it's persistent or distressing, it's worth talking to your provider.</p>
<p>related: <a href="/blog/how-to-survive-the-two-week-wait">how to survive the two-week wait</a></p>
<p class="source"><em>sources: <a href="https://www.acog.org/womens-health/faqs">ACOG</a> · <a href="https://www.healthychildren.org">AAP — HealthyChildren</a> · <a href="https://www.postpartum.net">Postpartum Support International</a> · <a href="https://988lifeline.org">988 Suicide & Crisis Lifeline</a></em></p>`,
    faqs: [
      { q: "is it normal to google pregnancy symptoms constantly?", a: "extremely. the uncertainty plus the stakes makes 2 a.m. searching almost universal — you're not being dramatic, and you're not alone." },
      { q: "what pregnancy symptoms are actually worth calling about?", a: "heavy bleeding (soaking a pad in an hour), severe or one-sided pain, a fever over 100.4°F, decreased fetal movement later in pregnancy, or signs of preeclampsia (bad headache, vision changes). when in doubt, call — providers would rather hear from you." },
      { q: "is it normal to feel anxious or not bonded right away?", a: "yes — bonding isn't always instant, and pregnancy and postpartum anxiety are common. if it's persistent or distressing, it's worth talking to your provider." },
    ],
  },
];

export function getPost(slug: string): BlogPost | null {
  return POSTS.find((p) => p.slug === slug) ?? null;
}

// Posts are evergreen, so we keep them in their declared order rather than
// sorting by date (dates were removed — they read like a content dump when
// everything shared one publish day).
export function getAllPosts(): BlogPost[] {
  return [...POSTS];
}

export function getRecentPosts(limit: number): BlogPost[] {
  return getAllPosts().slice(0, limit);
}
