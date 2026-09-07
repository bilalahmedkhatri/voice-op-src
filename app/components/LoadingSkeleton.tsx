import { designSystem as ds } from '../lib/designSystem';

interface LoadingSkeletonProps {
  variant?: 'textInput' | 'voiceControls' | 'audioPlayer' | 'savedPrompts' | 'voiceDropdown' | 'full';
}

export default function LoadingSkeleton({ variant = 'full' }: LoadingSkeletonProps) {
  const shimmerStyle = {
    position: 'relative' as const,
    overflow: 'hidden',
    backgroundColor: ds.colors.gray[200],
  };

  const shimmerAnimation = `
    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }
  `;

  const ShimmerBox = ({ width, height, borderRadius = ds.borderRadius.lg, marginBottom = '0' }: { width: string; height: string; borderRadius?: string; marginBottom?: string }) => (
    <div
      className="relative overflow-hidden bg-gray-200"
      style={{
        width,
        height,
        borderRadius,
        marginBottom,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
    </div>
  );

  // Text Input Skeleton
  const TextInputSkeleton = () => (
    <div className="mb-6 sm:mb-8 md:mb-12">
      <div className="flex justify-between mb-4">
        <ShimmerBox width="150px" height="24px" />
        <ShimmerBox width="120px" height="24px" />
      </div>
      <ShimmerBox width="100%" height="180px" marginBottom={ds.spacing.lg} />
      <div className="flex gap-4">
        <ShimmerBox width="140px" height="44px" />
        <ShimmerBox width="100px" height="44px" />
      </div>
    </div>
  );

  // Voice Dropdown Skeleton
  const VoiceDropdownSkeleton = () => (
    <div className="mb-6">
      <ShimmerBox width="120px" height="20px" marginBottom={ds.spacing.md} />
      <ShimmerBox width="100%" height="52px" borderRadius={ds.borderRadius.xl} />
    </div>
  );

  // Voice Controls Skeleton
  const VoiceControlsSkeleton = () => (
    <div className="mb-6 sm:mb-8 md:mb-12">
      <div className="flex items-center gap-2 mb-6">
        <ShimmerBox width="24px" height="24px" borderRadius={ds.borderRadius.md} />
        <ShimmerBox width="180px" height="28px" />
      </div>
      
      <VoiceDropdownSkeleton />
      
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <ShimmerBox width="100px" height="20px" />
              <ShimmerBox width="60px" height="32px" borderRadius={ds.borderRadius.md} />
            </div>
            <ShimmerBox width="100%" height="8px" borderRadius={ds.borderRadius.full} />
            <div className="flex justify-between">
              <ShimmerBox width="80px" height="14px" />
              <ShimmerBox width="80px" height="14px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Audio Player Skeleton
  const AudioPlayerSkeleton = () => (
    <div className="p-6 bg-white border-2 border-dashed border-gray-200 rounded-xl">
      <ShimmerBox width="100%" height="120px" marginBottom={ds.spacing.lg} borderRadius={ds.borderRadius.lg} />
      <div className="flex gap-4 mb-6">
        <ShimmerBox width="60px" height="60px" borderRadius={ds.borderRadius.full} />
        <div className="flex-1 flex flex-col justify-center gap-2">
          <ShimmerBox width="100%" height="8px" borderRadius={ds.borderRadius.full} />
          <div className="flex justify-between">
            <ShimmerBox width="60px" height="14px" />
            <ShimmerBox width="60px" height="14px" />
          </div>
        </div>
      </div>
      <div className="flex gap-4 justify-center">
        <ShimmerBox width="120px" height="44px" />
        <ShimmerBox width="120px" height="44px" />
      </div>
    </div>
  );

  // Saved Prompts Skeleton
  const SavedPromptsSkeleton = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <ShimmerBox width="180px" height="32px" />
        <ShimmerBox width="100px" height="32px" borderRadius={ds.borderRadius.full} />
      </div>
      <ShimmerBox width="100%" height="52px" marginBottom={ds.spacing.xl} borderRadius={ds.borderRadius.xl} />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border-2 border-gray-200 rounded-xl p-4">
            <ShimmerBox width="100%" height="120px" marginBottom={ds.spacing.md} borderRadius={ds.borderRadius.lg} />
            <ShimmerBox width="120px" height="16px" marginBottom={ds.spacing.md} />
            <div className="flex gap-2">
              <ShimmerBox width="100%" height="40px" />
              <ShimmerBox width="60px" height="40px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Full Page Skeleton
  const FullPageSkeleton = () => (
    <div className="flex flex-col gap-8">
      <TextInputSkeleton />
      <VoiceControlsSkeleton />
      <div className="text-center mb-6">
        <ShimmerBox width="220px" height="54px" marginBottom="0" />
        <div className="mx-auto inline-block" />
      </div>
      <AudioPlayerSkeleton />
    </div>
  );

  // Render based on variant
  const renderSkeleton = () => {
    switch (variant) {
      case 'textInput':
        return <TextInputSkeleton />;
      case 'voiceControls':
        return <VoiceControlsSkeleton />;
      case 'audioPlayer':
        return <AudioPlayerSkeleton />;
      case 'savedPrompts':
        return <SavedPromptsSkeleton />;
      case 'voiceDropdown':
        return <VoiceDropdownSkeleton />;
      case 'full':
      default:
        return <FullPageSkeleton />;
    }
  };

  return (
    <>
      {renderSkeleton()}
    </>
  );
}
