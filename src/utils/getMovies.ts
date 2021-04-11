import { execSync, exec } from "child_process";
import { Media } from "../types";

export const getMovies = (mediaList: Media[], folderName: string) => {
  mediaList.forEach((media, index) => {
    console.log(`Processing: ${media.url}`);

    execSync(`curl ${media.url} > dist/${folderName}/mv_${index}.mp4`);
  });
};
