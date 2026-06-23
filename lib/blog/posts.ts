export type Audience = "ttc" | "pregnant" | "postpartum" | "all";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  audience: Audience;
  date: string; // ISO publish date (YYYY-MM-DD)
  content: string; // HTML
};

export const AUDIENCE_LABEL: Record<Audience, string> = {
  ttc: "trying to conceive",
  pregnant: "pregnancy",
  postpartum: "postpartum",
  all: "for everyone",
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
  },
  {
    slug: "can-i-eat-sushi-while-pregnant",
    date: "2026-04-23",    title: "can i eat sushi while pregnant? here's the real answer.",
    description:
      "cooked sushi is fine during pregnancy. here's what ACOG and the FDA actually say about raw fish, mercury, and what to order.",
    audience: "pregnant",
    content: `<p>you're staring at a menu. your friend just ordered a spicy tuna roll. and now you're doing that thing where you pretend to study the menu while frantically trying to remember what the internet said about raw fish.</p>
<p>let's clear this up.</p>
<h2>the short answer</h2>
<p>cooked sushi is totally fine. raw sushi is where it gets complicated.</p>
<h2>what the experts say</h2>
<p>the FDA and ACOG (the American College of Obstetricians and Gynecologists) both recommend avoiding raw fish during pregnancy. the concern isn't the fish itself — it's the small risk of parasites and bacteria like listeria that can be more dangerous during pregnancy because your immune system is slightly suppressed.</p>
<p>but here's what often gets lost: <strong>cooked sushi is perfectly safe.</strong> that means shrimp tempura rolls, california rolls (imitation crab is cooked), eel/unagi (always cooked), fully cooked salmon rolls, and veggie rolls are all fine.</p>
<h2>what about the fish itself?</h2>
<p>even outside of sushi, fish is actually <em>recommended</em> during pregnancy. the FDA and ACOG suggest eating 2-3 servings of low-mercury fish per week for the omega-3s, which support your baby's brain development. good options: salmon, shrimp, tilapia, cod, and sardines.</p>
<p>the ones to avoid (high mercury): shark, swordfish, king mackerel, tilefish, and bigeye tuna.</p>
<h2>the bottom line</h2>
<p>you don't need to avoid sushi restaurants entirely. order the cooked rolls, enjoy the edamame, and skip the sashimi platter for now. your baby is going to be fine.</p>
<p>and if you accidentally ate a piece of raw salmon before you knew you were pregnant? take a breath. the actual risk is very low. your body is more resilient than the internet makes it sound.</p>
<p class="source"><em>sources: FDA food safety guidelines for pregnant women, ACOG committee opinion on nutrition during pregnancy</em></p>`,
  },
  {
    slug: "how-long-does-it-take-to-get-pregnant",
    date: "2026-04-23",    title:
      "how long does it take to get pregnant? the real numbers nobody tells you.",
    description:
      "85% of couples conceive within 12 months. here's what the research says about timelines, when to see a specialist, and what actually matters.",
    audience: "ttc",
    content: `<p>you've been trying for a few months. or maybe longer. and every time your period shows up, the same thought creeps in: <em>is something wrong with me?</em></p>
<p>before you spiral, let's look at what the numbers actually say.</p>
<h2>the real timeline</h2>
<p>according to ASRM (the American Society for Reproductive Medicine), here's what the data shows for healthy couples with no known fertility issues:</p>
<p><strong>after 1 month:</strong> about 30% of couples conceive<br><strong>after 3 months:</strong> about 60%<br><strong>after 6 months:</strong> about 80%<br><strong>after 12 months:</strong> about 85%</p>
<p>that means <strong>1 in 5 couples with no fertility problems will still not be pregnant after 6 months of trying.</strong> that's not a problem — that's normal.</p>
<h2>when should you see a specialist?</h2>
<p><strong>under 35:</strong> see a reproductive endocrinologist (RE) if you've been trying for 12 months<br><strong>35-39:</strong> see an RE after 6 months<br><strong>40+:</strong> see an RE after 3 months, or before you start trying</p>
<p>these aren't deadlines or failure points — they're just the point where it makes sense to get some data.</p>
<h2>what actually affects how long it takes</h2>
<p><strong>age</strong> — fertility declines gradually after 30 and more noticeably after 35, but plenty of women conceive naturally in their late 30s and early 40s</p>
<p><strong>ovulation regularity</strong> — irregular cycles can mean irregular ovulation, which makes timing harder</p>
<p><strong>underlying conditions</strong> — PCOS, endometriosis, thyroid issues, and blocked tubes can all play a role</p>
<p><strong>sperm factors</strong> — male factor accounts for about 30-40% of fertility challenges. it's not always about you.</p>
<p><strong>timing</strong> — you're most fertile in the 5 days before ovulation and the day of. outside that window, pregnancy isn't possible that cycle.</p>
<h2>the bottom line</h2>
<p>if you're under 12 months and everything checks out, you're likely in the normal range — even though it doesn't feel like it. the waiting is genuinely one of the hardest parts of this journey, and you're not alone in feeling that way.</p>
<p>if something feels off, trust your gut. you don't need to wait 12 months to ask questions.</p>
<p class="source"><em>sources: ASRM practice committee, ACOG FAQ on evaluating infertility</em></p>`,
  },
  {
    slug: "is-it-normal-to-not-feel-pregnant-in-the-first-trimester",
    date: "2026-04-23",    title: "is it normal to not feel pregnant in the first trimester?",
    description:
      "not having symptoms in early pregnancy is common. here's why you feel fine, when to worry, and why it doesn't mean anything is wrong.",
    audience: "pregnant",
    content: `<p>you just found out you're pregnant. you expected... something. nausea, maybe. exhaustion. sore breasts. some kind of sign that your body is doing this massive thing.</p>
<p>instead you feel... completely normal. and now you're worried that something is wrong.</p>
<h2>you're not alone. and nothing is wrong.</h2>
<p>not having symptoms in early pregnancy is incredibly common. despite what social media and pregnancy forums would have you believe, plenty of women sail through the first trimester feeling basically fine.</p>
<h2>what the research says</h2>
<p>about <strong>20-30% of women</strong> experience little to no nausea in the first trimester. symptoms typically peak between <strong>weeks 8-10</strong> — so if you're at 5 or 6 weeks and feel nothing, you might just not be there yet. some women never get morning sickness at all and have perfectly healthy pregnancies. symptom intensity has <strong>no correlation</strong> with how healthy your pregnancy is.</p>
<h2>why does this cause so much anxiety?</h2>
<p>because we've been conditioned to believe that symptoms = proof. if you're not throwing up, you must not really be pregnant. if you feel fine, something must be wrong.</p>
<p>this is not true. your body is doing an enormous amount of work behind the scenes — building a placenta, increasing blood volume, restructuring hormone levels — and some bodies just do it more quietly than others.</p>
<h2>when to actually worry</h2>
<p>symptoms or no symptoms, these are the things worth calling your provider about: heavy bleeding (soaking a pad in an hour), severe cramping that doesn't let up, sharp one-sided pain, or fever over 100.4°F.</p>
<p>not having nausea is not on that list.</p>
<h2>the bottom line</h2>
<p>you're pregnant. your body is doing its job. the absence of symptoms doesn't mean the absence of a baby. try to take the win — you're one of the lucky ones who gets to eat breakfast without running to the bathroom.</p>
<p class="source"><em>sources: ACOG, American Pregnancy Association</em></p>`,
  },
  {
    slug: "postpartum-hair-loss-why-it-happens-when-it-stops-and-what-helps",
    date: "2026-04-23",    title:
      "postpartum hair loss: why it happens, when it stops, and what actually helps.",
    description:
      "postpartum hair loss affects 40-50% of women, peaks at 4-6 months, and is temporary. here's the timeline and what actually works.",
    audience: "postpartum",
    content: `<p>you're standing in the shower watching clumps of hair circle the drain and wondering if you're going bald.</p>
<p>you're not. but nobody warned you about this part.</p>
<h2>what's happening</h2>
<p>during pregnancy, elevated estrogen keeps your hair in its growth phase longer than usual. that's why pregnancy hair feels so thick and amazing — you're literally shedding less.</p>
<p>after delivery, estrogen drops. all that hair that should have fallen out over the past 9 months starts falling out at once. it's called <strong>telogen effluvium</strong>, and it affects an estimated <strong>40-50% of women.</strong></p>
<h2>the timeline</h2>
<p><strong>starts:</strong> typically 2-4 months postpartum<br><strong>peaks:</strong> around 4-6 months postpartum (this is when it feels the worst)<br><strong>resolves:</strong> by 12 months postpartum for most women</p>
<h2>what actually helps</h2>
<p>nothing will stop the shedding completely — it's hormonal and it has to run its course. but these things can support the regrowth:</p>
<p><strong>keep taking your prenatal vitamins</strong> — the biotin, iron, and folate support hair health. <strong>eat enough protein</strong> — hair is made of protein. postpartum is not the time to diet. <strong>be gentle with your hair</strong> — avoid tight ponytails, heavy styling, and heat. <strong>biotin supplements</strong> — some women find these help, though the evidence is mixed.</p>
<h2>when to see a doctor</h2>
<p>if the shedding hasn't slowed down by 12 months postpartum, or if you notice bald patches (not just thinning), check in with your provider. occasionally postpartum hair loss can unmask an underlying thyroid issue or iron deficiency that's worth treating.</p>
<h2>the bottom line</h2>
<p>your hair will come back. it might come back differently (some women notice a change in texture or curl pattern), but it will come back. in the meantime, messy buns were invented for this exact season of life.</p>
<p class="source"><em>sources: American Academy of Dermatology (AAD), Journal of the American Academy of Dermatology</em></p>`,
  },
  {
    slug: "7-things-youre-googling-at-2am",
    date: "2026-04-23",    title:
      "7 things you're googling at 2 a.m. (and the answers so you can go back to sleep)",
    description:
      "honest answers to the pregnancy, ttc, and postpartum questions women search at 2 a.m. discharge, wine, sex drive, milestones, and more.",
    audience: "all",
    content: `<p>we know you're doing it. phone under the covers, incognito mode, typing something you'd never say out loud.</p>
<p>here are the honest answers to the most common 2 a.m. searches — so you can put the phone down and get some rest.</p>
<h2>1. "is this discharge normal"</h2>
<p>probably yes. vaginal discharge increases during pregnancy (it's called leukorrhea) and it's your body's way of keeping the birth canal clean. normal discharge is white or clear, mild-smelling, and not accompanied by itching or burning.</p>
<p>call your provider if: it's green/yellow, has a strong odor, or comes with itching.</p>
<h2>2. "i had a sip of wine before i knew i was pregnant"</h2>
<p>your baby is fine. in the very earliest weeks, before the placenta is fully established, exposure is minimal. the medical consensus is that occasional, small amounts of alcohol before you knew are extremely unlikely to cause any harm. stop punishing yourself. you didn't know.</p>
<h2>3. "is it normal to not want to have sex during pregnancy"</h2>
<p>yes. sex drive fluctuates wildly during pregnancy due to hormones, exhaustion, body changes, and anxiety. some women want more, some want less, some want none. all of this is normal.</p>
<h2>4. "my baby isn't crawling yet"</h2>
<p>the normal range for crawling is 6-10 months. some babies skip it entirely and go straight to pulling up or walking. developmental milestones are ranges, not deadlines.</p>
<h2>5. "do i have postpartum depression or am i just tired"</h2>
<p><strong>baby blues</strong> (normal): mood swings, crying spells, anxiety, difficulty sleeping. starts within 2-3 days, resolves within 2 weeks.</p>
<p><strong>postpartum depression</strong> (needs support): persistent sadness, hopelessness, difficulty bonding, loss of interest, lasting longer than 2 weeks.</p>
<p>if it's been more than 2 weeks and the fog isn't lifting, please talk to your provider. PPD affects 1 in 7 women, it's treatable, and asking for help is one of the strongest things you can do.</p>
<h2>6. "how long is too long trying to conceive"</h2>
<p>under 35: 12 months. over 35: 6 months. but if something feels off sooner, trust your instincts and make the appointment.</p>
<h2>7. "why do i feel like i hate my partner during pregnancy"</h2>
<p>hormones. the combination of progesterone surges, exhaustion, anxiety, and feeling physically uncomfortable can make even the most loving relationship feel strained. you're not a bad person. you're a pregnant person. it's temporary.</p>
<h2>the bottom line</h2>
<p>you're not the only one lying awake googling these things. you're normal. you're okay. now put the phone down.</p>
<p>or don't — and ask myla instead. she's up too. 💛</p>
<p class="source"><em>sources: ACOG, AAP, American Pregnancy Association, Postpartum Support International</em></p>`,
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
