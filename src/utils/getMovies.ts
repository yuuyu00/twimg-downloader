import { writeFileSync } from "fs";
import axios from "axios";
import { Media } from "../types";

export const getMovies = (mediaList: Media[]) => {
  mediaList.forEach(async (media, index) => {
    console.log(`Processing: ${media.url}`);

    const { data } = await axios.get(media.url);
    writeFileSync(`/tmp/mv_${index}.mp4`, data);
  });
};
