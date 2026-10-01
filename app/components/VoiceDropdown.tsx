import { useState, useRef } from 'react';
import { FaPlay, FaPause, FaMicrophone } from 'react-icons/fa';
import { designSystem as ds } from '../lib/designSystem';
import { VoiceSample } from '../lib/voiceoverApi';
import LoadingSkeleton from './LoadingSkeleton';

interface VoiceDropdownProps {
  voices: VoiceSample[];
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  loading?: boolean;
  error?: string | null;
}

export default function VoiceDropdown({
  voices,
  selectedVoice,
  onVoiceChange,
  loading = false,
  error = null,
}: VoiceDropdownProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedVoiceData = voices.find(v => v.voice_id === selectedVoice);

  if (loading) {
    return <LoadingSkeleton variant="voiceDropdown" />;
  }

  const handlePlaySample = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedVoiceData?.sample_url) return;

    setPlaybackError(null);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(selectedVoiceData.sample_url);
    audioRef.current = audio;
    setIsPlaying(true);

    audio.play().catch((err) => {
      // console.error('Error playing audio:', err);
      // console.error('Original Sample URL:', selectedVoiceData.sample_url);
      setIsPlaying(false);
      setPlaybackError(`Failed to play audio sample: ${err.message}`);
    });

    audio.onended = () => {
      setIsPlaying(false);
      setPlaybackError(null);
    };

    audio.onerror = () => {
      // console.error('Audio error event');
      // console.error('Original Sample URL:', selectedVoiceData.sample_url);
      setIsPlaying(false);
      setPlaybackError('Failed to load audio file. Please try again.');
    };
  };

  const handleStopSample = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleChangeVoice = () => {
    setIsDropdownOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: ds.spacing.sm }}>
      <label
        htmlFor="voice-select"
        style={{
          fontSize: ds.typography.sizes.sm,
          fontWeight: ds.typography.weights.semibold,
          color: ds.colors.gray[700],
          fontFamily: ds.typography.fonts.heading,
          display: 'flex',
          alignItems: 'center',
          gap: ds.spacing.xs,
        }}
      >
        <FaMicrophone /> Voice
      </label>

      {playbackError && (
        <div style={{
          padding: ds.spacing.sm,
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: ds.borderRadius.md,
          fontSize: ds.typography.sizes.sm,
          color: '#c33',
        }}>
          {playbackError}
        </div>
      )}

      {!selectedVoice || isDropdownOpen ? (
        // Dropdown mode - show when no selection or user wants to change
        <div style={{ display: 'flex', gap: ds.spacing.sm, alignItems: 'center', width: '100%', maxWidth: '100%', minWidth: 0 }}>
          <select
            id="voice-select"
            value={selectedVoice}
            onChange={(e) => {
              onVoiceChange(e.target.value);
              if (e.target.value) {
                setIsDropdownOpen(false);
              }
            }}
            disabled={loading || !!error}
            autoFocus={isDropdownOpen}
            style={{
              flex: 1,
              maxWidth: '100%',
              minWidth: 0,
              padding: `${ds.spacing.sm} ${ds.spacing.md}`,
              paddingRight: 'clamp(2rem, 5vw, 2.5rem)',
              border: '1px solid #e5e7eb',
              borderRadius: ds.borderRadius.lg,
              fontSize: 'clamp(0.8rem, 2vw, 0.95rem)',
              fontFamily: ds.typography.fonts.body,
              backgroundColor: 'white',
              cursor: loading || error ? 'not-allowed' : 'pointer',
              outline: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              color: ds.colors.gray[800],
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.25rem',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
            onFocus={(e) => {
              if (!loading && !error) {
                e.currentTarget.style.borderColor = '#ff9b8f';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 155, 143, 0.1)';
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
              if (selectedVoice) {
                setIsDropdownOpen(false);
              }
            }}
            onMouseEnter={(e) => {
              if (!loading && !error && e.currentTarget !== document.activeElement) {
                e.currentTarget.style.borderColor = '#ffb4a8';
              }
            }}
            onMouseLeave={(e) => {
              if (e.currentTarget !== document.activeElement) {
                e.currentTarget.style.borderColor = '#e5e7eb';
              }
            }}
          >
            {loading && <option value="">Loading voices...</option>}
            {error && <option value="">Error loading voices</option>}
            {!loading && !error && voices.length === 0 && <option value="">No voices available</option>}
            {!loading && !error && voices.length > 0 && (
              <>
                <option value="">Select a voice</option>
                {voices.map((voice) => (
                  <option key={voice.voice_id} value={voice.voice_id}>
                    {voice.voice_name}
                    {voice.accent && ` - ${voice.accent}`}
                    {voice.language && ` (${voice.language})`}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
      ) : (
        // Button mode - show when voice is selected
        <div style={{ display: 'flex', gap: ds.spacing.md, alignItems: 'center' }}>
          {/* Circular Play/Pause Button */}
          <button
            onClick={isPlaying ? handleStopSample : handlePlaySample}
            style={{
              width: 'clamp(64px, 15vw, 96px)',
              height: 'clamp(64px, 15vw, 96px)',
              background: isPlaying 
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : 'linear-gradient(135deg, #ff9b8f 0%, #ff7d6e 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: `all ${ds.transitions.base}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isPlaying 
                ? '0 4px 14px rgba(245, 158, 11, 0.5)'
                : '0 4px 14px rgba(255, 125, 110, 0.4)',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 125, 110, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = isPlaying 
                ? '0 4px 14px rgba(245, 158, 11, 0.5)'
                : '0 4px 14px rgba(255, 125, 110, 0.4)';
            }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <FaPause size={32} color="white" />
            ) : (
              <FaPlay size={32} color="white" style={{ marginLeft: '6px' }} />
            )}
          </button>

          {/* Voice Info and Change Link */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: ds.spacing.sm,
              marginBottom: ds.spacing.xs,
            }}>
              <h4 style={{
                fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                fontWeight: ds.typography.weights.semibold,
                color: ds.colors.gray[900],
                fontFamily: ds.typography.fonts.heading,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}>
                {selectedVoiceData?.voice_name}
              </h4>
              <button
                onClick={handleChangeVoice}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c83a2a',
                  fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)',
                  fontWeight: ds.typography.weights.semibold,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  flexShrink: 0,
                  fontFamily: ds.typography.fonts.heading,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#a5281a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#c83a2a';
                }}
              >
                Change
              </button>
            </div>
            
            {selectedVoiceData?.description && (
              <p style={{
                fontSize: 'clamp(0.7rem, 1.8vw, 0.75rem)',
                color: ds.colors.gray[600],
                fontFamily: ds.typography.fonts.body,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: '1.4',
              }}>
                {selectedVoiceData.description}
              </p>
            )}

            {/* Voice Tags */}
            <div style={{ 
              display: 'flex', 
              gap: ds.spacing.xs, 
              marginTop: ds.spacing.xs,
              flexWrap: 'wrap',
            }}>
              {selectedVoiceData?.gender && (
                <span style={{
                  fontSize: 'clamp(0.65rem, 1.6vw, 0.75rem)',
                  padding: `2px ${ds.spacing.xs}`,
                  background: ds.colors.gray[100],
                  borderRadius: ds.borderRadius.full,
                  color: ds.colors.gray[600],
                  fontFamily: ds.typography.fonts.body,
                }}>
                  {selectedVoiceData.gender}
                </span>
              )}
              {selectedVoiceData?.accent && (
                <span style={{
                  fontSize: 'clamp(0.65rem, 1.6vw, 0.75rem)',
                  padding: `2px ${ds.spacing.xs}`,
                  background: ds.colors.gray[100],
                  borderRadius: ds.borderRadius.full,
                  color: ds.colors.gray[600],
                  fontFamily: ds.typography.fonts.body,
                }}>
                  {selectedVoiceData.accent}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <span
          style={{
            fontSize: ds.typography.sizes.xs,
            color: ds.colors.error,
            fontFamily: ds.typography.fonts.body,
          }}
        >
          ⚠️ {error}
        </span>
      )}
    </div>
  );
}
