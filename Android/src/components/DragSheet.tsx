// Full-screen sheet that slides up and can be swiped back down, as an
// alternative to the close button. Shared by every bottom-up surface.
//
// Built on core PanResponder + Animated: react-native-gesture-handler is not a
// dependency and cannot be added. Three things this has to get right:
//
//  - The responder is created exactly once. Call sites pass inline arrows for
//    onClose, so rebuilding it per render would orphan an in-flight drag.
//  - The JS driver, not the native one. translateY is pushed with setValue on
//    every move, and a natively-attached value ignores those.
//  - Capture-phase claiming. The header holds buttons and the settings body is
//    a ScrollView; either can take the responder on touch-down and never give
//    it back, so the drag has to claim ahead of them -- but only once the
//    touch has really travelled down, or taps would stop working.

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
// Downward travel required before the drag takes the touch from a child.
const CLAIM_AFTER = 5;

interface Props {
  visible: boolean;
  onClose: () => void;
  // Rendered inside the draggable area, under the grabber.
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

    const wantsDrag = (dy: number, dx: number) => dy > CLAIM_AFTER && dy > Math.abs(dx);

    responderRef.current = PanResponder.create({
      // Taps must reach the buttons underneath, so never claim on touch-down.
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_event, gesture) =>
        wantsDrag(gesture.dy, gesture.dx),
      onMoveShouldSetPanResponder: (_event, gesture) => wantsDrag(gesture.dy, gesture.dx),
      onPanResponderMove: (_event, gesture) => {
        translateY.setValue(Math.max(0, gesture.dy));
      },
      // Once the drag is ours, nothing else may take it mid-gesture.
      onPanResponderTerminationRequest: () => false,
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
          <View style={styles.dragArea} {...responderRef.current.panHandlers}>
            <View style={styles.grabberRow}>
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
  dragArea: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  // Deliberately tall: this band plus the header is the whole grab target.
  grabberRow: {
    alignItems: 'center',
    paddingTop: space.sm,
    paddingBottom: space.sm,
  },
  grabber: {
    width: 48,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.textSubtle,
  },
});
