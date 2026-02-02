import React, { useState } from 'react';

// ============================================
// CAMPAIGN TYPES & DATA
// ============================================

interface Quest {
  id: string;
  title: string;
  description: string;
  xp: number;
  status: 'locked' | 'available' | 'completed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  requiredQuests?: string[];
}

interface Level {
  id: string;
  name: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  quests: Quest[];
  isUnlocked: boolean;
}

const CAMPAIGN_DATA: Level[] = [
  {
    id: 'level-1',
    name: 'Beginner',
    difficulty: 'beginner',
    isUnlocked: true,
    quests: [
      {
        id: 'q1-history',
        title: 'History of C++',
        description: 'Learn about the origins and evolution of C++ programming language',
        xp: 10,
        status: 'completed',
        difficulty: 'beginner'
      },
      {
        id: 'q1-intro',
        title: 'Introduction to C++ Programming',
        description: 'Basic syntax and program structure',
        xp: 10,
        status: 'completed',
        difficulty: 'beginner',
        requiredQuests: ['q1-history']
      },
      {
        id: 'q1-datatypes',
        title: 'DataTypes, Variables & Operators',
        description: 'Master the fundamentals of data and operations',
        xp: 15,
        status: 'available',
        difficulty: 'beginner',
        requiredQuests: ['q1-intro']
      },
      {
        id: 'q1-conditionals',
        title: 'Conditional & Control Statements',
        description: 'Learn if-else, switch, and decision making',
        xp: 20,
        status: 'locked',
        difficulty: 'beginner',
        requiredQuests: ['q1-datatypes']
      },
      {
        id: 'q1-arrays',
        title: 'Arrays, Strings & Pointers in C++',
        description: 'Work with collections and memory',
        xp: 25,
        status: 'locked',
        difficulty: 'beginner',
        requiredQuests: ['q1-conditionals']
      }
    ]
  },
  {
    id: 'level-2',
    name: 'Intermediate',
    difficulty: 'intermediate',
    isUnlocked: false,
    quests: [
      {
        id: 'q2-functions',
        title: 'Functions & Recursion',
        description: 'Create reusable code blocks',
        xp: 30,
        status: 'locked',
        difficulty: 'intermediate'
      },
      {
        id: 'q2-loops',
        title: 'Advanced Loop Patterns',
        description: 'Nested loops and complex iterations',
        xp: 35,
        status: 'locked',
        difficulty: 'intermediate'
      }
    ]
  },
  {
    id: 'level-3',
    name: 'Advanced',
    difficulty: 'advanced',
    isUnlocked: false,
    quests: [
      {
        id: 'q3-oop',
        title: 'Object-Oriented Programming',
        description: 'Classes, objects, and inheritance',
        xp: 50,
        status: 'locked',
        difficulty: 'advanced'
      }
    ]
  }
];

// ============================================
// CAMPAIGN COMPONENT
// ============================================

interface CampaignProps {
  user: any;
  onBack: () => void;
  onQuestStart: (questId: string) => void;
}

export const Campaign: React.FC<CampaignProps> = ({ user, onBack, onQuestStart }) => {
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [hoveredQuest, setHoveredQuest] = useState<string | null>(null);

  // Mock stats - in production, fetch from user data
  const stats = {
    finished: 2,
    total: 3,
    xpEarned: 20,
    xpTotal: 30,
    streak: 1,
    streakTotal: 3
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      color: '#fff',
      fontFamily: "'Press Start 2P', cursive",
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Animated Background Stars */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3 }}>
        {[...Array(50)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: '2px',
            height: '2px',
            background: '#fff',
            borderRadius: '50%',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `twinkle ${2 + Math.random() * 3}s infinite`
          }} />
        ))}
      </div>

      {/* HEADER */}
      <div style={{ 
        padding: '20px 40px', 
        borderBottom: '4px solid #facc15',
        background: '#1a1a1a',
        position: 'relative',
        zIndex: 10
      }}>
        <button 
          onClick={onBack}
          style={{
            background: '#ef4444',
            border: '2px solid #fff',
            color: '#fff',
            padding: '10px 20px',
            fontSize: '0.7rem',
            cursor: 'pointer',
            fontFamily: "'Press Start 2P', cursive"
          }}
        >
          &laquo; BACK TO HUB
        </button>
        <h1 style={{ 
          textAlign: 'center', 
          color: '#facc15', 
          margin: '20px 0 10px',
          fontSize: '1.5rem',
          letterSpacing: '3px'
        }}>
          CODESENSE JOURNEY
        </h1>
      </div>

      {/* LEVEL SELECTION VIEW */}
      {!selectedLevel && (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
            {CAMPAIGN_DATA.map((level, index) => (
              <div 
                key={level.id}
                onClick={() => level.isUnlocked && setSelectedLevel(level)}
                style={{
                  width: '250px',
                  height: '300px',
                  background: level.isUnlocked 
                    ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                    : '#0f172a',
                  border: level.isUnlocked ? '4px solid #facc15' : '4px solid #475569',
                  padding: '30px',
                  cursor: level.isUnlocked ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s',
                  position: 'relative',
                  opacity: level.isUnlocked ? 1 : 0.5,
                  filter: level.isUnlocked ? 'none' : 'grayscale(1)',
                  transform: 'translateY(0)',
                }}
                onMouseEnter={(e) => {
                  if (level.isUnlocked) {
                    e.currentTarget.style.transform = 'translateY(-10px)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(250, 204, 21, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>
                  {index === 0 ? '🛡️' : index === 1 ? '⚔️' : '🏆'}
                </div>
                <div style={{ 
                  fontSize: '0.6rem', 
                  color: '#94a3b8', 
                  marginBottom: '10px',
                  letterSpacing: '2px'
                }}>
                  LEVEL {index + 1}
                </div>
                <h2 style={{ 
                  fontSize: '1rem', 
                  color: level.isUnlocked ? '#facc15' : '#64748b',
                  marginBottom: '15px' 
                }}>
                  {level.name.toUpperCase()}
                </h2>
                <div style={{ fontSize: '0.6rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                  {level.quests.length} Quests
                </div>
                {!level.isUnlocked && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '3rem',
                    opacity: 0.8
                  }}>
                    🔒
                  </div>
                )}
                {level.isUnlocked && (
                  <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '0.5rem',
                    color: '#4ade80',
                    textAlign: 'center',
                    width: '80%'
                  }}>
                    PRESS TO START
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUEST LIST VIEW */}
      {selectedLevel && (
        <div style={{ padding: '40px' }}>
          
          {/* Level Header */}
          <div style={{ 
            background: '#1e293b', 
            border: '4px solid #facc15',
            padding: '30px',
            marginBottom: '30px',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginBottom: '10px' }}>
                  {selectedLevel.difficulty.toUpperCase()} | LEVEL {CAMPAIGN_DATA.findIndex(l => l.id === selectedLevel.id) + 1}
                </div>
                <h2 style={{ fontSize: '1.2rem', color: '#facc15' }}>
                  {selectedLevel.name.toUpperCase()}
                </h2>
              </div>
              
              {/* Stats */}
              <div style={{ display: 'flex', gap: '30px', fontSize: '0.6rem' }}>
                <div>
                  <div style={{ color: '#94a3b8', marginBottom: '5px' }}>Finished</div>
                  <div style={{ color: '#4ade80', fontSize: '0.8rem' }}>{stats.finished}/{stats.total}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', marginBottom: '5px' }}>XP Earned</div>
                  <div style={{ color: '#facc15', fontSize: '0.8rem' }}>{stats.xpEarned}/{stats.xpTotal}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', marginBottom: '5px' }}>Streak</div>
                  <div style={{ color: '#f97316', fontSize: '0.8rem' }}>{stats.streak}/{stats.streakTotal}</div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedLevel(null)}
                style={{
                  background: '#475569',
                  border: '2px solid #cbd5e1',
                  color: '#fff',
                  padding: '10px 20px',
                  fontSize: '0.6rem',
                  cursor: 'pointer',
                  fontFamily: "'Press Start 2P', cursive"
                }}
              >
                BACK TO LEVELS
              </button>
            </div>
          </div>

          {/* Quest Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {selectedLevel.quests.map((quest) => (
              <div 
                key={quest.id}
                onMouseEnter={() => setHoveredQuest(quest.id)}
                onMouseLeave={() => setHoveredQuest(null)}
                style={{
                  background: quest.status === 'completed' 
                    ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)'
                    : quest.status === 'available'
                    ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                    : '#0f172a',
                  border: quest.status === 'completed'
                    ? '4px solid #4ade80'
                    : quest.status === 'available'
                    ? '4px solid #facc15'
                    : '4px solid #475569',
                  padding: '25px',
                  borderRadius: '10px',
                  position: 'relative',
                  cursor: quest.status === 'available' ? 'pointer' : 'default',
                  opacity: quest.status === 'locked' ? 0.5 : 1,
                  transition: 'all 0.3s',
                  transform: hoveredQuest === quest.id && quest.status === 'available' ? 'scale(1.05)' : 'scale(1)'
                }}
                onClick={() => quest.status === 'available' && onQuestStart(quest.id)}
              >
                {/* Status Badge */}
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  fontSize: '1.5rem'
                }}>
                  {quest.status === 'completed' ? '✅' : quest.status === 'locked' ? '🔒' : '📋'}
                </div>

                <h3 style={{ 
                  fontSize: '0.7rem', 
                  color: quest.status === 'available' ? '#facc15' : '#cbd5e1',
                  marginBottom: '15px',
                  lineHeight: '1.4',
                  paddingRight: '40px'
                }}>
                  {quest.title}
                </h3>
                
                <p style={{ 
                  fontSize: '0.5rem', 
                  color: '#94a3b8', 
                  lineHeight: '1.6',
                  marginBottom: '20px',
                  fontFamily: "'Roboto Mono', monospace"
                }}>
                  {quest.description}
                </p>

                {/* XP Badge */}
                <div style={{ 
                  display: 'inline-block',
                  background: quest.status === 'completed' ? '#4ade80' : '#facc15',
                  color: '#000',
                  padding: '5px 15px',
                  fontSize: '0.6rem',
                  borderRadius: '5px',
                  fontWeight: 'bold'
                }}>
                  +{quest.xp} XP
                </div>

                {quest.status === 'available' && hoveredQuest === quest.id && (
                  <div style={{
                    position: 'absolute',
                    bottom: '15px',
                    right: '15px',
                    fontSize: '0.5rem',
                    color: '#4ade80',
                    animation: 'pulse 1s infinite'
                  }}>
                    START &raquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};