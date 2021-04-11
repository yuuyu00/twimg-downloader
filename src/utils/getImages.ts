import { writeFileSync } from "fs";
import axios from "axios";
import * as AdmZip from "adm-zip";
import { Media } from "../types";

export const getImages = async (mediaList: Media[]) => {
  return Promise.all(
    mediaList.map(async (media) => {
      console.log(`Processing: ${media.url}`);

      const { data } = await axios.get(media.url, {
        responseType: "arraybuffer",
      });
      return data;
    })
  );
};
