// Full-screen sheet that slides up and can be swiped back down, as an
// alternative to the close button. Shared by every bottom-up surface.
//
// Built on core PanResponder + Animated: react-native-gesture-handler is not a
// dependency and cannot be added. The gesture is bound to the grabber and
// header only, so lists and inputs in the body still scroll normally, and it
// waits for real downward travel before claiming the touch so taps on the
// header buttons still land.

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
const CLAIM_AFTER = 6;

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

  // A sheet dismissed by swipe is left translated off-screen; put it back
  // before it is shown again.
  useEffect(() => {
    if (visible) translateY.setValue(0);
  }, [visible, translateY]);

  const panResponder = useMemo(() => {
    const settle = () => {
      Animated.spring(translateY, {
        toValue: 0,
        bounciness: 0,
        useNativeDriver: true,
      }).start();
    };

    return PanResponder.create({
      // Never claim on touch-down, or the header buttons stop working.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gesture) =>
        gesture.dy > CLAIM_AFTER && gesture.dy > Math.abs(gesture.dx),
      onPanResponderMove: (_event, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_event, gesture) => {
        if (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY) {
          Animated.timing(translateY, {
            toValue: Dimensions.get('window').height,
            duration: 160,
            useNativeDriver: true,
          }).start(() => onClose());
          return;
        }
        settle();
      },
      onPanResponderTerminate: settle,
    });
  }, [onClose, translateY]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Animated.View
        style={[styles.screen, { transform: [{ translateY }] }]}
        testID={testID}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.dragArea} {...panResponder.panHandlers}>
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
    paddingTop: space.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  grabberRow: {
    alignItems: 'center',
    paddingBottom: space.xs,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
});
