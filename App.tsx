import React, { useState, useEffect } from "react";
import {
  ViroARScene,
  ViroARSceneNavigator,
  ViroQuad,
  ViroMaterials,
  ViroAnimations,
  ViroTrackingReason,
} from "@reactvision/react-viro";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Dimensions,
  StatusBar,
} from "react-native";

// Sample flashcards
const flashcards = [
  {
    front: require("./res/card_front_1.png"),
    back: require("./res/card_back_1.png"),
  },
  {
    front: require("./res/card_front_2.png"),
    back: require("./res/card_back_2.png"),
  },
  {
    front: require("./res/card_front_3.png"),
    back: require("./res/card_back_3.png"),
  },
];

// Register materials for each flashcard
const registerMaterials = () => {
  const materials = {};

  flashcards.forEach((card, index) => {
    materials[`flashcard_${index}`] = {
      diffuseTexture: card.front,
      doubleSided: true,
    };
    materials[`flashcard_${index}_back`] = {
      diffuseTexture: card.back,
      doubleSided: true,
    };
  });

  ViroMaterials.createMaterials(materials);
};

// Call this once to register all materials
registerMaterials();

// Animations
ViroAnimations.registerAnimations({
  flipToBack: {
    properties: {
      rotateY: "+=180",
      scaleX: 0.95,
      scaleY: 0.95,
    },
    duration: 300,
    easing: "EaseInEaseOut",
  },
  flipToFront: {
    properties: {
      rotateY: "-=180",
      scaleX: 0.95,
      scaleY: 0.95,
    },
    duration: 300,
    easing: "EaseInEaseOut",
  },
  resetScale: {
    properties: {
      scaleX: 1.0,
      scaleY: 1.0,
    },
    duration: 200,
    easing: "EaseOut",
  },
  slideOutLeft: {
    properties: {
      positionX: "-=1.5",
      opacity: 0,
    },
    duration: 250,
    easing: "EaseIn",
  },
  slideInRight: {
    properties: {
      positionX: "+=1.5",
      opacity: 1,
    },
    duration: 250,
    easing: "EaseOut",
  },
  slideOutRight: {
    properties: {
      positionX: "+=1.5",
      opacity: 0,
    },
    duration: 250,
    easing: "EaseIn",
  },
  slideInLeft: {
    properties: {
      positionX: "-=1.5",
      opacity: 1,
    },
    duration: 250,
    easing: "EaseOut",
  },
  fadeIn: {
    properties: { opacity: 1 },
    duration: 200,
    easing: "EaseOut",
  },
  fadeOut: {
    properties: { opacity: 0 },
    duration: 200,
    easing: "EaseIn",
  },
});

// AR Scene Component
const FlashcardARScene = (props: any) => {
  const appProps = props.sceneNavigator?.viroAppProps;
  if (!appProps) return null;

  const { currentIndex, isFlipped, flipTrigger, transitionTrigger } = appProps;

  const [position, setPosition] = useState([0, 0, -1]);
  const [animationName, setAnimationName] = useState<string | null>(null);
  const [displayedSide, setDisplayedSide] = useState(isFlipped);
  const [animationKey, setAnimationKey] = useState(0);

  // Flip animation - change component with animation
  useEffect(() => {
    if (flipTrigger !== null) {
      setAnimationKey((prev) => prev + 1);
      setAnimationName("fadeOut");

      setTimeout(() => {
        // Change the displayed side during fade
        setDisplayedSide(isFlipped);
        setAnimationName("fadeIn");
        setAnimationKey((prev) => prev + 1);
      }, 200);

      setTimeout(() => {
        setAnimationName(null);
      }, 400);
    }
  }, [flipTrigger, isFlipped]);

  // Slide transition for next/prev
  useEffect(() => {
    if (transitionTrigger?.direction && transitionTrigger?.key !== null) {
      const { direction } = transitionTrigger;
      const slideOut = direction === "next" ? "slideOutLeft" : "slideOutRight";
      const slideIn = direction === "next" ? "slideInRight" : "slideInLeft";

      setAnimationKey((prev) => prev + 1);
      setAnimationName(slideOut);

      setTimeout(() => {
        setDisplayedSide(false); // Always show front after slide
        setPosition(direction === "next" ? [1.5, 0, -1] : [-1.5, 0, -1]);
        setAnimationName(slideIn);
        setAnimationKey((prev) => prev + 1);
      }, 250);

      setTimeout(() => {
        setPosition([0, 0, -1]);
        setAnimationName(null);
      }, 500);
    }
  }, [transitionTrigger]);

  const onInitialized = (state: any, reason: ViroTrackingReason) => {
    console.log("AR Tracking:", state, reason);
  };

  // Choose which material to show based on displayed side
  const currentMaterial = displayedSide
    ? `flashcard_${currentIndex}_back`
    : `flashcard_${currentIndex}`;

  return (
    <ViroARScene onTrackingUpdated={onInitialized}>
      <ViroQuad
        key={`flashcard-${currentIndex}-${displayedSide}-${animationKey}`}
        position={position}
        rotation={[0, 0, 0]}
        width={0.7}
        height={0.45}
        materials={[currentMaterial]}
        animation={
          animationName
            ? { name: animationName, run: true, loop: false }
            : undefined
        }
      />
    </ViroARScene>
  );
};

// Main App
const FlashcardApp = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipTrigger, setFlipTrigger] = useState<number | null>(null);
  const [flipKey, setFlipKey] = useState(0);

  const [transitionTrigger, setTransitionTrigger] = useState<{
    direction: "next" | "prev";
    key: number;
  } | null>(null);
  const [transitionKey, setTransitionKey] = useState(0);

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
    setFlipKey((prev) => prev + 1);
    setFlipTrigger(flipKey + 1);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % flashcards.length;
    setCurrentIndex(nextIndex);
    setIsFlipped(false); // Always reset to front
    setTransitionKey((prev) => prev + 1);
    setTransitionTrigger({ direction: "next", key: transitionKey + 1 });
  };

  const handlePrev = () => {
    const prevIndex =
      currentIndex === 0 ? flashcards.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setIsFlipped(false); // Always reset to front
    setTransitionKey((prev) => prev + 1);
    setTransitionTrigger({ direction: "prev", key: transitionKey + 1 });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ViroARSceneNavigator
        autofocus={true}
        initialScene={{ scene: FlashcardARScene }}
        viroAppProps={{
          currentIndex,
          isFlipped,
          flipTrigger,
          transitionTrigger,
        }}
        style={styles.arView}
      />

      {/* Top UI - Progress indicator */}
      <View style={styles.topUI}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {flashcards.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentIndex + 1) / flashcards.length) * 100}%` },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Bottom UI - Controls */}
      <View style={styles.bottomUI}>
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            onPress={handlePrev}
            style={[styles.button, styles.navButton]}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonIcon}>←</Text>
            <Text style={styles.buttonText}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleFlip}
            style={[styles.button, styles.flipButton]}
            activeOpacity={0.7}
          >
            <Text style={styles.flipIcon}>↔</Text>
            <Text style={styles.buttonText}>
              {isFlipped ? "Show Front" : "Show Back"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            style={[styles.button, styles.navButton]}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonIcon}>→</Text>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Side indicators */}
      <View style={styles.sideIndicator}>
        <View style={[styles.indicator, !isFlipped && styles.activeIndicator]}>
          <Text style={styles.indicatorText}>Front</Text>
        </View>
        <View style={[styles.indicator, isFlipped && styles.activeIndicator]}>
          <Text style={styles.indicatorText}>Back</Text>
        </View>
      </View>

      {/* Card info overlay */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardInfoText}>
          {isFlipped ? "Back Side" : "Front Side"}
        </Text>
      </View>
    </View>
  );
};

export default FlashcardApp;

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  arView: {
    flex: 1,
  },
  topUI: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  progressContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    padding: 16,
    backdropFilter: "blur(10px)",
  },
  progressText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#00D4FF",
    borderRadius: 2,
  },
  bottomUI: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 16,
    padding: 16,
    backdropFilter: "blur(10px)",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
  },
  navButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  flipButton: {
    backgroundColor: "#00D4FF",
    paddingHorizontal: 24,
  },
  buttonIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  flipIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  sideIndicator: {
    position: "absolute",
    right: 20,
    top: "50%",
    transform: [{ translateY: -40 }],
    zIndex: 1,
  },
  indicator: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  activeIndicator: {
    backgroundColor: "#00D4FF",
  },
  indicatorText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  cardInfo: {
    position: "absolute",
    top: 120,
    left: 20,
    zIndex: 1,
  },
  cardInfoText: {
    color: "#00D4FF",
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
});
