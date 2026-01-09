import { GAME_COLORS } from '@/constants/game';
import { StyleSheet } from 'react-native';

export const gameStyles = StyleSheet.create({
  // L2WGame styles
  container: {
    flex: 1,
    backgroundColor: GAME_COLORS.background,
  },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    display: 'flex',
    padding: 20,
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
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 2,
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
    textAlign: 'center',
  },
  subtitle: {
    color: GAME_COLORS.subtitle,
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 10,
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
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
  },
  countersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    backgroundColor: GAME_COLORS.background,
    paddingVertical: 4,
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
    marginBottom: 4,
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
    marginVertical: 6,
    maxWidth: 120,
    minWidth: 120,
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
    paddingVertical: 4,
    backgroundColor: GAME_COLORS.background,
  },
  counterItem: {
    width: 30,
    alignItems: 'center',
  },
  counterLetterText: {
    fontWeight: 'bold',
  },
  counterNumberText: {
    fontWeight: 'bold',
    marginTop: 2,
  },

  // TransitionMessage styles
  transitionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  message: {
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

