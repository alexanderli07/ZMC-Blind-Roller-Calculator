// Full-screen sheet that slides up over a dimmed screen and can be swiped back
// down, as an alternative to the close button. Shared by every bottom-up
// surface.
//
// Built on core PanResponder + Animated: react-native-gesture-handler is not a
// dependency and cannot be added. Five things this has to get right:
//
//  - The gesture lives on a dedicated grab strip -- the band holding the pill
//    at the top -- and nothing else. That strip has no buttons or lists beneath
//    it, so the responder is claimed outright on touch-down. Winning it from
//    the header buttons and the settings ScrollView after a movement threshold
//    is what failed before; there is nothing here to negotiate with.
//  - The responder is created exactly once. Call sites pass inline arrows for
//    onClose, so rebuilding it per render would orphan an in-flight drag.
//  - The entrance waits for the modal to actually be on screen. Starting it as
//    soon as visible flipped meant the animation was already part-way through
//    by the time iOS finished presenting, so the sheet popped into view
//    mid-flight instead of sliding up from the bottom.
//  - Each animated value keeps to one driver for its whole life. translateY is
//    JS-driven because PanResponder feeds it from JS every frame; the backdrop
//    is native-driven and never touched during a drag, which keeps the frame
//    cost to a single transform update. Mixing drivers on one value throws.
//  - Every animation is a timing curve. A spring was settling with a wobble.

import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

import { ThemeColors, useTheme } from '../theme/theme';
import { radius, space } from '../theme/tokens';

// How far down, or how fast, before a release dismisses instead of snapping back.
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.7;
// A full nav-bar's worth of grabbing room, the whole width of the sheet.
const STRIP_HEIGHT = 56;

const OPEN_DURATION = 280;
const CLOSE_DURATION = 220;
// A released drag continues at roughly the speed the finger left at, so the
// handover is not a visible change of pace. Bounds keep a flick from being
// instant and a slow release from crawling.
const RELEASE_MIN_DURATION = 130;
const RELEASE_MAX_DURATION = 320;
// Floor on px/ms, so a near-motionless release still resolves promptly.
const MIN_RELEASE_SPEED = 1.1;
// Fallback in case onShow never arrives, so a sheet can never stick off-screen.
const ENTRANCE_FALLBACK = 250;

function releaseDuration(distance: number, velocity: number): number {
  const speed = Math.max(Math.abs(velocity), MIN_RELEASE_SPEED);
  const carried = Math.max(1, distance) / speed;
  return Math.min(RELEASE_MAX_DURATION, Math.max(RELEASE_MIN_DURATION, carried));
}

const offscreen = () => Dimensions.get('window').height;

interface Props {
  visible: boolean;
  onClose: () => void;
  // Rendered under the grab strip. Not draggable -- it holds buttons.
  header: ReactNode;
  children: ReactNode;
  testID?: string;
}

export default function DragSheet({ visible, onClose, header, children, testID }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Never animated with the native driver, because the drag sets it from JS.
  const translateY = useRef(new Animated.Value(offscreen())).current;
  // Only ever animated, never set, so it can stay on the native driver.
  const backdrop = useRef(new Animated.Value(0)).current;

  // The sheet has to outlive visible=false long enough to animate out, so the
  // Modal follows this rather than the prop.
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);
  const enteredRef = useRef(false);

  // Read through a ref so the responder below never has to be rebuilt.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const runEntrance = () => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: OPEN_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(backdrop, {
        toValue: 1,
        duration: OPEN_DURATION,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    if (visible) {
      enteredRef.current = false;
      mountedRef.current = true;
      setMounted(true);
      // Normally onShow beats this; it exists only so a missed onShow cannot
      // leave the sheet parked below the screen.
      const fallback = setTimeout(runEntrance, ENTRANCE_FALLBACK);
      return () => clearTimeout(fallback);
    }

    if (!mountedRef.current) return;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: offscreen(),
        duration: CLOSE_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(backdrop, {
        toValue: 0,
        duration: CLOSE_DURATION,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      // Reopening interrupts this; unmounting then would kill the new sheet.
      if (!finished) return;
      mountedRef.current = false;
      setMounted(false);
    });
    return undefined;
    // runEntrance is stable in everything it touches, and adding it would
    // re-run the whole open/close animation on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, translateY, backdrop]);

  const responderRef = useRef<ReturnType<typeof PanResponder.create> | null>(null);
  if (responderRef.current === null) {
    // Snapping back covers however far the drag got, at the speed it was
    // travelling, so a 5pt nudge does not take as long as a 100pt pull.
    const settle = (dragged: number, velocity: number) => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: releaseDuration(Math.max(0, dragged), velocity),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    };

    responderRef.current = PanResponder.create({
      // Nothing sits under the strip, so take the touch immediately.
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      // Keeps a native scroll view from taking over on Android.
      onShouldBlockNativeResponder: () => true,
      onPanResponderMove: (_event, gesture) => {
        translateY.setValue(Math.max(0, gesture.dy));
      },
      onPanResponderRelease: (_event, gesture) => {
        if (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY) {
          const travelled = Math.max(0, gesture.dy);
          // Only the distance still to cover, or a long drag would take as
          // long to finish as a short one.
          const duration = releaseDuration(offscreen() - travelled, gesture.vy);
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: offscreen(),
              duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: false,
            }),
            Animated.timing(backdrop, {
              toValue: 0,
              duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start(({ finished }) => {
            if (!finished) return;
            mountedRef.current = false;
            setMounted(false);
            onCloseRef.current();
          });
          return;
        }
        settle(gesture.dy, gesture.vy);
      },
      onPanResponderTerminate: (_event, gesture) => settle(gesture.dy, gesture.vy),
    });
  }

  return (
    // Transparent and unanimated: the sheet uncovers the live screen behind it
    // as it is dragged, and Modal's own slide would carry the backdrop up from
    // the bottom along with the sheet.
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onShow={runEntrance}
      onRequestClose={onClose}
    >
      <View style={styles.fill}>
        <Animated.View pointerEvents="none" style={[styles.backdrop, { opacity: backdrop }]} />
        <Animated.View
          style={[styles.screen, { transform: [{ translateY }] }]}
          testID={testID}
        >
          <SafeAreaView style={styles.safe}>
            <View style={styles.chrome}>
              <View
                accessibilityRole="adjustable"
                accessibilityLabel="Drag down to close"
                style={styles.grabStrip}
                testID={testID ? `${testID}-grabber` : undefined}
                {...responderRef.current.panHandlers}
              >
                <View style={styles.grabber} />
              </View>
              {header}
            </View>
            {children}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  fill: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  safe: {
    flex: 1,
  },
  chrome: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  grabStrip: {
    height: STRIP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grabber: {
    width: 56,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.textSubtle,
  },
});
