const video = document.createElement("video");
const canvasStream = document.createElement("canvas");
const context = canvasStream.getContext("2d");

const [width, height] = [100, 100];
let stream = undefined;

export const requestCameraPermission = () => {
  return new Promise(async (res, rej) => {
    try {
      const permission = await navigator.permissions.query({ name: "camera" });
      if (permission.state === "granted") res();
      rej(new Error("Couldn't get camera permissions"));
    } catch (err) {
      rej(new Error("Couldn't get camera permissions"));
    }
  });
};

export const startStream = () => {
  return new Promise(async (res, rej) => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      video.srcObject = stream;
      video.play();
      res(true);
    } catch (err) {
      rej(new Error("Couldn't get camera feed"));
    }
  });
};

const capturePicture = async () => {
  canvasStream.width = width;
  canvasStream.height = height;
  context.drawImage(video, 0, 0, width, height);

  const pic = await new Promise((res) => {
    canvasStream.toBlob((blob) => res(blob), "image/webp");
  });

  return pic;
};

const reader = new FileReader();
const convertBlobBase64 = (blob) => {
  return new Promise((res, rej) => {
    if (typeof blob !== "object") rej();

    reader.addEventListener("load", () => {
      res(reader.result);
    });

    reader.readAsDataURL(blob);
  });
};

export const takePicture = () => {
  return new Promise(async (res, rej) => {
    try {
      res(await convertBlobBase64(await capturePicture()));
    } catch (err) {
      rej(err);
    }
  });
};
