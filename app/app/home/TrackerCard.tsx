"use client";

import type { LocalProfile } from "@/lib/profile";
import {
  currentBabyAge,
  currentPregnancyWeek,
  formatBabyAge,
  getPostpartumMonth,
  getPregnancyWeek,
  trimesterLabel,
  ttcEncouragement,
} from "@/lib/tracker";

// A lightweight, self-updating tracking snapshot for the home screen.
// Everything here derives from the user's existing profile data and the
// current date, so the card moves forward on its own as time passes.
export default function TrackerCard({ profile }: { profile: LocalProfile }) {
  if (profile.stage === "pregnant") {
    const week = currentPregnancyWeek(profile);
    if (week == null) return null;
    const data = getPregnancyWeek(week);
    const weeksToGo = Math.max(0, 40 - week);
    const progress = Math.min(100, Math.round((week / 40) * 100));

    return (
      <section
        className="mx-5 mt-5 rounded-2xl border p-4"
        style={{
          backgroundColor: "rgba(248,200,168,0.06)",
          borderColor: "rgba(248,200,168,0.18)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-peach/80">
              week {week}
            </div>
            <div className="mt-1 text-[13px] text-cream/60">
              {trimesterLabel(week)}
            </div>
          </div>
          <div className="text-right text-[12px] text-cream/55">
            {weeksToGo > 0 ? `${weeksToGo} wks to go` : "any day now 🤍"}
          </div>
        </div>

        {data && (
          <>
            <p className="mt-4 text-[15px] leading-relaxed text-cream/90">
              baby is about the size of{" "}
              <span className="text-peach">{data.size}</span>.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-cream/70">
              {data.developing}
            </p>
            <div className="mt-3 rounded-2xl bg-midnight/60 px-3 py-2.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-lavender/80">
                common right now
              </span>
              <p className="mt-1 text-[12px] leading-relaxed text-cream/65">
                {data.symptoms}
              </p>
            </div>
          </>
        )}

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-midnight">
          <div
            className="h-full rounded-full bg-peach-gradient transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-cream/45">
          <span>1</span>
          <span>40</span>
        </div>
      </section>
    );
  }

  if (profile.stage === "postpartum") {
    const age = currentBabyAge(profile);
    const month = age ? getPostpartumMonth(age.months) : null;

    return (
      <section
        className="mx-5 mt-5 rounded-2xl border p-4"
        style={{
          backgroundColor: "rgba(190,178,215,0.06)",
          borderColor: "rgba(190,178,215,0.18)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-lavender/90">
              {age ? formatBabyAge(age) : "new mom"}
            </div>
            <div className="mt-1 text-[13px] text-cream/60">
              first year · you&apos;re doing it
            </div>
          </div>
          <div className="text-right text-[12px] text-cream/55">🤍</div>
        </div>

        {month ? (
          <>
            <div className="mt-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-sage">
                milestone window
              </span>
              <p className="mt-1 text-[15px] leading-relaxed text-cream/90">
                {month.milestone}
              </p>
            </div>
            <div className="mt-3 rounded-2xl bg-midnight/60 px-3 py-2.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-peach/80">
                what to expect
              </span>
              <p className="mt-1 text-[12px] leading-relaxed text-cream/65">
                {month.expect}
              </p>
            </div>
          </>
        ) : (
          <p className="mt-4 text-[15px] leading-relaxed text-cream/90">
            those blurry, sleepless first weeks — one day at a time. 🤍
          </p>
        )}

        <p className="mt-3 text-[12px] leading-relaxed text-cream/45">
          ranges vary wildly — your baby&apos;s on their own timeline.
        </p>
      </section>
    );
  }

  if (profile.stage === "ttc") {
    const ttc = ttcEncouragement(profile.monthsTrying);
    return (
      <section
        className="mx-5 mt-5 rounded-2xl border p-4"
        style={{
          backgroundColor: "rgba(162,200,162,0.06)",
          borderColor: "rgba(162,200,162,0.18)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-sage">
              trying to conceive
            </div>
            <div className="mt-1 text-[13px] text-cream/80">{ttc.label}</div>
          </div>
          <div className="text-right text-[12px] text-cream/55">
            {profile.monthsTrying !== null
              ? `${profile.monthsTrying} ${profile.monthsTrying === 1 ? "mo" : "mos"} in`
              : "🌱"}
          </div>
        </div>

        {/* Cycle day would show here when we have it — we don't collect it
            yet, so it's intentionally omitted rather than faked. */}

        <div className="mt-4 flex items-start gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-peach/80 whitespace-nowrap mt-1">
            from myla
          </span>
        </div>
        <p className="mt-1 text-[15px] leading-relaxed text-cream/90">
          {ttc.body}
        </p>
      </section>
    );
  }

  return null;
}
