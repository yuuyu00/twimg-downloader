import { createWriteStream } from "fs";
import axios from "axios";
import { Media } from "../types";

export const getMovies = (mediaList: Media[]) => {
  return Promise.all(
    mediaList.map(async (media, index) => {
      console.log(`Processing: ${media.url}`);

      const { data } = await axios.get(media.url, {
        responseType: "stream",
      });

      return new Promise<string>((resolve, reject) => {
        const filePath = `/tmp/mv_${index}.mp4`;
        data
          .pipe(createWriteStream(filePath))
          .on("finish", () => resolve(filePath));
      });
    })
  );
};
