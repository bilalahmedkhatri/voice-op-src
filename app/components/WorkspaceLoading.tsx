
import {useCopy} from '@/i18n/copy';
interface WorkspaceLoadingProps {
  fullScreen?: boolean;
}

const waveformHeights = [18, 30, 44, 26, 52, 36, 22];

export default function WorkspaceLoading({ fullScreen = false }: WorkspaceLoadingProps) {
  const copy = useCopy();


  return (
    <section
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={copy("Preparing your studio")}
      className={`flex w-full items-center justify-center bg-slate-50 px-5 py-10 sm:px-8 ${fullScreen ? 'min-h-dvh' : 'min-h-[60dvh]'}`}
    >
      <div className="w-full max-w-3xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div aria-hidden="true" className="mb-5 flex h-20 w-20 items-center justify-center gap-1 rounded-3xl bg-[#ff7d6e]/10">
            {waveformHeights.map((height, index) => (
              <span
                key={index}
                className="w-1.5 rounded-full bg-[#ff7d6e] motion-safe:animate-pulse"
                style={{ height, animationDelay: `${index * 120}ms` }}
              />
            ))}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{copy("Loading...")}</h1>
        </div>
      </div>
    </section>
  );
}
