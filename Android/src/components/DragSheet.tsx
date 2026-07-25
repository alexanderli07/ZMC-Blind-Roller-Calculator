// Full-screen sheet that slides up over a dimmed screen and can be swiped back
// down, as an alternative to the close button. Shared by every bottom-up
// surface.
//
// Built on core PanResponder + Animated: react-native-gesture-handler is not a
// dependency and cannot be added. Four things this has to get right:
//
//  - The gesture lives on a dedicated grab strip -- the band holding the pill
//    at the top -- and nothing else. That strip has no buttons or lists beneath
//    it, so the responder is claimed outright on touch-down. Winning it from
//    the header buttons and the settings ScrollView after a movement threshold
//    is what failed before; there is nothing here to negotiate with.
//  - The responder is created exactly once. Call sites pass inline arrows for
//    onClose, so rebuilding it per render would orphan an in-flight drag.
//  - The JS driver, not the native one. translateY is pushed with setValue on
//    every move, and a natively-attached value ignores those.
//  - The Modal is transparent and animates nothing itself. Its own slide would
//    drag the backdrop up with the sheet, so entrance and exit are animated
//    here instead, and the sheet stays mounted until the exit finishes.

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
// Tall enough to be an easy target for a thumb reaching the top of the screen.
const STRIP_HEIGHT = 34;

const OPEN_DURATION = 260;
const CLOSE_DURATION = 200;
const FLING_DURATION = 160;

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
  const translateY = useRef(new Animated.Value(offscreen())).current;

  // The sheet has to outlive visible=false long enough to animate out, so the
  // Modal follows this rather than the prop.
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);

  // Read through a ref so the responder below never has to be rebuilt.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      mountedRef.current = true;
      setMounted(true);
      translateY.setValue(offscreen());
      Animated.timing(translateY, {
        toValue: 0,
        duration: OPEN_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      return;
    }

    if (!mountedRef.current) return;
    Animated.timing(translateY, {
      toValue: offscreen(),
      duration: CLOSE_DURATION,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      // Reopening interrupts this; unmounting then would kill the new sheet.
      if (!finished) return;
      mountedRef.current = false;
      setMounted(false);
    });
  }, [visible, translateY]);

  // Fades out as the sheet is dragged clear, so the screen behind it comes up
  // to full brightness exactly as it is revealed. Memoised so each render does
  // not graft a fresh node onto the animation.
  const backdropOpacity = useMemo(
    () =>
      translateY.interpolate({
        inputRange: [0, offscreen()],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [translateY]
  );

  const responderRef = useRef<ReturnType<typeof PanResponder.create> | null>(null);
  if (responderRef.current === null) {
    const settle = () => {
      Animated.spring(translateY, {
        toValue: 0,
        bounciness: 0,
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
          Animated.timing(translateY, {
            toValue: offscreen(),
            duration: FLING_DURATION,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }).start(({ finished }) => {
            if (!finished) return;
            mountedRef.current = false;
            setMounted(false);
            onCloseRef.current();
          });
          return;
        }
        settle();
      },
      onPanResponderTerminate: settle,
    });
  }

  return (
    // Transparent and unanimated: the sheet uncovers the live screen behind it
    // as it is dragged, and Modal's own slide would carry the backdrop along
    // with it.
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.fill}>
        <Animated.View
          pointerEvents="none"
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        />
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
    width: 48,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.textSubtle,
  },
});
