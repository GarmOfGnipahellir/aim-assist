import { Pt } from "pts";
import { space } from ".";

export type InputMode = "mouse" | "gamepad";

export let gamepad: any | null = null;
export let inputAngle: number;
export let inputMode: InputMode = "mouse";

export function setInputMode(newMode: InputMode) {
  inputMode = newMode;
}
export function updateInput() {
  if (gamepad) {
    let dir = new Pt(gamepad.axes[2].valueOf(), gamepad.axes[3].valueOf());
    if (dir.magnitude() > 0.5) {
      setInputMode("gamepad");
    }
  }

  switch (inputMode) {
    case "mouse":
      updateInputMouse();
      break;
    case "gamepad":
      updateInputGamepad();
      break;
  }
}

function updateInputMouse() {
  let delta = space.pointer.$subtract(space.center);
  inputAngle = Math.atan2(delta.y, delta.x);
}

function updateInputGamepad() {
  if (gamepad) {
    let dir = new Pt(gamepad.axes[2].valueOf(), gamepad.axes[3].valueOf());
    if (dir.magnitude() > 0.5) {
      inputAngle = Math.atan2(dir.y, dir.x);
    }
  }
}

window.addEventListener("gamepadconnected", (e) => {
  if (!gamepad) {
    gamepad = navigator.getGamepads()[e.gamepad.index];
  }
  console.log(
    "Gamepad connected at index %d: %s. %d buttons, %d axes.",
    e.gamepad.index,
    e.gamepad.id,
    e.gamepad.buttons.length,
    e.gamepad.axes.length
  );
});

window.addEventListener("gamepaddisconnected", (e) => {
  if (gamepad && gamepad.index === e.gamepad.index) {
    null;
  }
  console.log(
    "Gamepad disconnected from index %d: %s",
    e.gamepad.index,
    e.gamepad.id
  );
});
