"use client";

import dynamic from "next/dynamic";
import { GoogleAttribution } from "@/components/ui/GoogleAttribution";

const ReactCompareImage = dynamic(() => import("react-compare-image"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full animate-pulse items-center justify-center bg-slate-100">
      <span className="text-xs text-slate-400">Loading preview…</span>
    </div>
  ),
});

type Props = {
  before: string;
  after: string | null;
};

export function BeforeAfter({ before, after }: Props) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-100 shadow-card sm:shadow-xl">
      {after ? (
        <ReactCompareImage
          leftImage={before}
          leftImageLabel="Before"
          rightImage={after}
          rightImageLabel="After ✨"
          sliderLineColor="#4F46E5"
          sliderPositionPercentage={0.5}
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={before} alt="Property" className="h-full w-full object-cover" />
      )}
      <GoogleAttribution />
    </div>
  );
}
