import { StyleSheet } from 'react-native';
import { GAME_COLORS } from '@/constants/game';

/**
 * Unified styles for all game components
 */
export const gameStyles = StyleSheet.create({
  // L2WGame styles
  container: {
    flex: 1,
    backgroundColor: GAME_COLORS.background,
  },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    padding: 10,
    minHeight: 200,
  },
  completeContainer: {
    alignItems: 'center',
    padding: 40,
  },
  completeText: {
    fontWeight: 'bold',
    color: GAME_COLORS.failForward,
    marginBottom: 20,
  },
  completeScore: {
    color: GAME_COLORS.score,
  },

  // GameHeader styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: GAME_COLORS.background,
    flexWrap: 'wrap',
  },
  titleContainer: {
    flex: 1,
    minWidth: 120,
  },
  title: {
    fontWeight: 'bold',
    color: GAME_COLORS.title,
  },
  subtitle: {
    color: GAME_COLORS.subtitle,
  },
  infoContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  score: {
    fontWeight: 'bold',
    color: GAME_COLORS.score,
  },
  level: {
    fontWeight: 'bold',
    color: GAME_COLORS.score,
  },

  // PartAGrid styles
  gridContainer: {
    backgroundColor: GAME_COLORS.background,
    borderWidth: 1,
    borderColor: GAME_COLORS.gridLine,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // PartBGrid styles
  gridWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
  },
  gridContainerRotated: {
    backgroundColor: GAME_COLORS.background,
    borderWidth: 1,
    borderColor: GAME_COLORS.gridLine,
    margin: 50,
  },
  countersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    backgroundColor: GAME_COLORS.background,
  },
  counter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterDisabled: {
    opacity: 0.3,
  },
  counterSquare: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  counterLetter: {
    fontWeight: 'bold',
  },
  counterNumber: {
    fontWeight: 'bold',
  },
  draggingPiece: {
    position: 'absolute',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  draggingCell: {
    borderWidth: 1,
    borderColor: GAME_COLORS.gridLine,
  },

  // GameButton styles
  button: {
    backgroundColor: GAME_COLORS.startButton,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: 'bold',
    color: GAME_COLORS.background,
    textTransform: 'uppercase',
  },

  // Counters styles
  countersContainerPartA: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: GAME_COLORS.background,
  },
  counterItem: {
    alignItems: 'center',
  },
  counterLetterText: {
    fontWeight: 'bold',
  },
  counterNumberText: {
    fontWeight: 'bold',
    marginTop: 4,
  },

  // TransitionMessage styles
  transitionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  message: {
    fontWeight: 'bold',
    marginVertical: 5,
  },
  fail: {
    color: GAME_COLORS.fail,
  },
  failForward: {
    color: GAME_COLORS.failForward,
  },
  doIt: {
    color: GAME_COLORS.doIt,
  },

  // PartBGrid micro control buttons
  microControlContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 200,
  },
  microControlButton: {
    width: 40,
    height: 40,
    backgroundColor: GAME_COLORS.title,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  microControlButtonText: {
    color: GAME_COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

