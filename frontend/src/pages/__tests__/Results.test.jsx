import { render, screen } from '@testing-library/react';
import Results from '../Results';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

vi.mock('../../hooks/useLiveEvaluation', () => ({
  default: () => ({
    evaluation: {
      evaluationModel: 'LEGACY_COMPONENT_HEALTH',
      overall: {
        health: 'FAIR',
        total_score: 64,
        longevity_years: 2,
        sustainability: 'MEDIUM',
        reusable: true
      },
      components: {
        keyboard: { health: 'GOOD', score: 82 },
        gpu: { health: 'FAIR', score: 66 },
        bluetooth: { health: 'GOOD', score: 88 },
        wifi: { health: 'GOOD', score: 91 },
        sound: { health: 'FAIR', score: 58 }
      }
    },
    connectionStatus: 'connected',
    lastUpdate: new Date().toISOString(),
    error: null,
    isConnected: true
  })
}));

describe('Results page (legacy module cards)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'AI summary unavailable' })
    });
  });

  it('renders keyboard, gpu, bluetooth, wifi and sound module cards', async () => {
    render(<Results />);

    expect(await screen.findByText('KEYBOARD')).toBeInTheDocument();
    expect(screen.getByText('GPU')).toBeInTheDocument();
    expect(screen.getByText('BLUETOOTH')).toBeInTheDocument();
    expect(screen.getByText('WIFI')).toBeInTheDocument();
    expect(screen.getByText('SOUND')).toBeInTheDocument();
  });

  it('shows other components navigation card text', async () => {
    render(<Results />);

    expect(await screen.findByText('OTHER COMPONENTS')).toBeInTheDocument();
    expect(screen.getByText('GPU, Display, I/O, Motherboard')).toBeInTheDocument();
  });
});
