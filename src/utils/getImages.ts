import { exec } from "child_process";
import { Media } from "../types";

export const getImages = (mediaList: Media[], folderName: string) => {
  mediaList.forEach((media, index) => {
    console.log(`Processing: ${media.url}`);

    exec(`curl ${media.url} > dist/${folderName}/img_${index}.jpg`);
  });
};
