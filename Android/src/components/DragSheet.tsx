// Full-screen sheet that slides up and can be swiped back down, as an
// alternative to the close button. Shared by every bottom-up surface.
//
// Built on core PanResponder + Animated: react-native-gesture-handler is not a
// dependency and cannot be added.
//
// The gesture lives on a dedicated grab strip -- the band holding the pill at
// the very top -- and nothing else. That strip has no buttons or lists beneath
// it, so the responder can be claimed outright on touch-down instead of being
// won from a child after a movement threshold. Threshold-and-capture
// negotiation against the header buttons and the settings ScrollView is what
// failed before; there is nothing here to negotiate with.
//
// Two other things this has to get right:
//  - The responder is created exactly once. Call sites pass inline arrows for
//    onClose, so rebuilding it per render would orphan an in-flight drag.
//  - The JS driver, not the native one. translateY is pushed with setValue on
//    every move, and a natively-attached value ignores those.

import React, { ReactNode, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
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
  const translateY = useRef(new Animated.Value(0)).current;

  // Read through a ref so the responder below never has to be rebuilt.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // A sheet dismissed by swipe is left translated off-screen; put it back
  // before it is shown again.
  useEffect(() => {
    if (visible) translateY.setValue(0);
  }, [visible, translateY]);

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
            toValue: Dimensions.get('window').height,
            duration: 160,
            useNativeDriver: false,
          }).start(() => onCloseRef.current());
          return;
        }
        settle();
      },
      onPanResponderTerminate: settle,
    });
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
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
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
