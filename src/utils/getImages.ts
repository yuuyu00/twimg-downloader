import { writeFileSync } from "fs";
import axios from "axios";
import * as AdmZip from "adm-zip";
import { Media } from "../types";

export const getImages = async (mediaList: Media[]) => {
  const zip = new AdmZip();

  const imageList = await Promise.all(
    mediaList.map(async (media) => {
      console.log(`Processing: ${media.url}`);

      const { data } = await axios.get(media.url, {
        responseType: "arraybuffer",
      });
      return data;
    })
  );

  imageList.map((data, index) => zip.addFile(`/tmp/${index}.jpg`, data));
  zip.writeZip("/tmp/images.zip");
};
