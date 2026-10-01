import { useState } from 'react';
import { FaEdit, FaSave, FaTrash, FaSearch, FaDownload, FaFont } from 'react-icons/fa';
import { designSystem as ds } from '../lib/designSystem';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface SavedPromptsProps {
  prompts: string[];
  onLoad: (prompt: string) => void;
  onDelete: (index: number) => void;
}

export default function SavedPrompts({ prompts, onLoad, onDelete }: SavedPromptsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [promptToDelete, setPromptToDelete] = useState<number | null>(null);

  const filteredPrompts = prompts.filter(prompt =>
    prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (prompts.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: `${ds.spacing['5xl']} ${ds.spacing.xl}`,
        background: ds.colors.gray[50],
        borderRadius: ds.borderRadius['2xl'],
        border: `2px dashed ${ds.colors.gray[300]}`,
      }}>
        <div style={{ fontSize: '4rem', marginBottom: ds.spacing.lg, display: 'flex', justifyContent: 'center' }}>
          <FaEdit style={{ color: ds.colors.gray[400], fontSize: '4rem' }} />
        </div>
        <h3 style={{ 
          fontSize: ds.typography.sizes['2xl'], 
          fontWeight: ds.typography.weights.bold,
          color: ds.colors.gray[700],
          marginBottom: ds.spacing.md,
          fontFamily: ds.typography.fonts.heading,
        }}>
          No Saved Prompts Yet
        </h3>
        <p style={{ 
          fontSize: ds.typography.sizes.base, 
          color: ds.colors.gray[600],
          fontFamily: ds.typography.fonts.body,
        }}>
          Your saved prompts will appear here. Start by entering text and clicking the Save button!
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Header with Search */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: ds.spacing.lg,
        marginBottom: ds.spacing.xl,
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: ds.spacing.md,
        }}>
          <h3 style={{
            fontSize: ds.typography.sizes['2xl'],
            fontWeight: ds.typography.weights.bold,
            color: ds.colors.gray[800],
            fontFamily: ds.typography.fonts.heading,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: ds.spacing.sm,
          }}>
            <FaSave /> Saved Prompts
          </h3>
          <span style={{
            padding: `${ds.spacing.xs} ${ds.spacing.md}`,
            background: 'linear-gradient(135deg, #ff9b8f 0%, #ffb4a8 100%)',
            color: 'white',
            borderRadius: ds.borderRadius.full,
            fontSize: ds.typography.sizes.sm,
            fontWeight: ds.typography.weights.semibold,
            boxShadow: ds.shadows.sm,
            fontFamily: ds.typography.fonts.mono,
          }}>
            {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'}
          </span>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
          <FaSearch style={{
            position: 'absolute',
            left: ds.spacing.lg,
            top: '50%',
            transform: 'translateY(-50%)',
            color: ds.colors.gray[400],
            fontSize: '1.1rem',
            pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '100%',
              padding: `${ds.spacing.md} ${ds.spacing.lg}`,
              paddingLeft: ds.spacing['3xl'],
              background: 'white',
              border: `2px solid ${ds.colors.gray[200]}`,
              borderRadius: ds.borderRadius.xl,
              fontSize: ds.typography.sizes.base,
              fontFamily: ds.typography.fonts.body,
              outline: 'none',
              transition: `all ${ds.transitions.base}`,
              boxShadow: ds.shadows.sm,
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#ff9b8f';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 155, 143, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = ds.colors.gray[200];
              e.currentTarget.style.boxShadow = ds.shadows.sm;
            }}
            onMouseEnter={(e) => {
              if (document.activeElement !== e.currentTarget) {
                e.currentTarget.style.borderColor = '#ffb4a8';
              }
            }}
            onMouseLeave={(e) => {
              if (document.activeElement !== e.currentTarget) {
                e.currentTarget.style.borderColor = ds.colors.gray[200];
              }
            }}
          />
        </div>
      </div>

      {/* Prompts Grid */}
      {filteredPrompts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: `${ds.spacing['3xl']} ${ds.spacing.xl}`,
          background: ds.colors.gray[50],
          borderRadius: ds.borderRadius.xl,
          color: ds.colors.gray[600],
        }}>
          <div style={{ fontSize: '3rem', marginBottom: ds.spacing.md }}>🔍</div>
          <p style={{ fontFamily: ds.typography.fonts.body }}>
            No prompts match &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'clamp(1rem, 2vw, 1.5rem)',
        }}>
          {filteredPrompts.map((prompt, index) => {
            const originalIndex = prompts.indexOf(prompt);
            return (
              <div
                key={index}
                role="button"
                tabIndex={0}
                aria-label={`Load prompt: ${prompt.substring(0, 60)}${prompt.length > 60 ? '...' : ''}`}
                title={prompt.substring(0, 120)}
                onClick={() => onLoad(prompt)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onLoad(prompt); } }}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  background: 'white',
                  border: `2px solid ${hoveredIndex === index ? '#ff9b8f' : ds.colors.gray[200]}`,
                  borderRadius: ds.borderRadius.xl,
                  padding: ds.spacing.lg,
                  boxShadow: hoveredIndex === index ? '0 10px 25px rgba(255, 155, 143, 0.2)' : ds.shadows.md,
                  transition: `all ${ds.transitions.base}`,
                  transform: hoveredIndex === index ? 'translateY(-4px)' : 'translateY(0)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: ds.spacing.md,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {/* Prompt Preview */}
                <div style={{
                  flex: 1,
                  padding: ds.spacing.md,
                  background: ds.colors.gray[50],
                  borderRadius: ds.borderRadius.lg,
                  fontSize: ds.typography.sizes.sm,
                  lineHeight: '1.6',
                  color: ds.colors.gray[700],
                  fontFamily: ds.typography.fonts.body,
                  maxHeight: '120px',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  {prompt.substring(0, 150)}{prompt.length > 150 ? '...' : ''}
                  {prompt.length > 150 && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '40px',
                      background: `linear-gradient(to bottom, transparent, ${ds.colors.gray[50]})`,
                    }} />
                  )}
                </div>

                {/* Metadata */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: ds.spacing.sm,
                  fontSize: ds.typography.sizes.xs,
                  color: ds.colors.gray[500],
                  fontFamily: ds.typography.fonts.mono,
                }}>
                  <FaFont />
                  <span>{prompt.length} characters</span>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: ds.spacing.sm,
                }}>
                  <button
                    onClick={() => onLoad(prompt)}
                    style={{
                      flex: 1,
                      padding: `${ds.spacing.sm} ${ds.spacing.md}`,
                      background: 'linear-gradient(135deg, #ff9b8f 0%, #ffb4a8 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: ds.borderRadius.lg,
                      fontSize: ds.typography.sizes.sm,
                      fontWeight: ds.typography.weights.semibold,
                      cursor: 'pointer',
                      transition: `all ${ds.transitions.base}`,
                      boxShadow: ds.shadows.sm,
                      fontFamily: ds.typography.fonts.heading,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = ds.shadows.lg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = ds.shadows.sm;
                    }}
                  >
                    <FaDownload style={{ marginRight: ds.spacing.xs }} />
                    Load
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPromptToDelete(originalIndex);
                    }}
                    style={{
                      padding: `${ds.spacing.sm} ${ds.spacing.md}`,
                      background: 'white',
                      color: ds.colors.error,
                      border: `2px solid ${ds.colors.error}`,
                      borderRadius: ds.borderRadius.lg,
                      fontSize: ds.typography.sizes.sm,
                      fontWeight: ds.typography.weights.semibold,
                      cursor: 'pointer',
                      transition: `all ${ds.transitions.base}`,
                      boxShadow: ds.shadows.sm,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = ds.colors.error;
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = ds.colors.error;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal 
        isOpen={promptToDelete !== null} 
        onClose={() => setPromptToDelete(null)} 
        onConfirm={() => {
          if (promptToDelete !== null) {
            onDelete(promptToDelete);
            setPromptToDelete(null);
          }
        }}
        title="Delete Saved Prompt"
        message="Are you sure you want to delete this prompt?"
      />

    </div>
  );
}

