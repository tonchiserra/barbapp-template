import { Link } from "@/components/ui";
import { Header } from "@/components/sections/header";
import { Footer } from "@/components/sections/footer";
import { Carousel } from "@/components/sections/carousel";
import { Video } from "@/components/sections/video";
import { Gallery } from "@/components/sections/gallery";
import { Multicolumn } from "@/components/sections/multicolumn";
import { getPublicSiteSettings } from "@/lib/queries/site-settings";
import { DEFAULT_HEADER_SETTINGS, DEFAULT_FOOTER_SETTINGS, DEFAULT_CAROUSEL_SETTINGS, DEFAULT_VIDEO_SETTINGS, DEFAULT_GALLERY_SETTINGS, DEFAULT_MULTICOLUMN_SETTINGS } from "@/types";

export default async function Home() {
  const siteSettings = await getPublicSiteSettings();
  const headerSettings = siteSettings?.header ?? DEFAULT_HEADER_SETTINGS;
  const footerSettings = siteSettings?.footer ?? DEFAULT_FOOTER_SETTINGS;
  const carouselSettings = siteSettings?.carousel ?? DEFAULT_CAROUSEL_SETTINGS;
  const videoSettings = siteSettings?.video ?? DEFAULT_VIDEO_SETTINGS;
  const gallerySettings = siteSettings?.gallery ?? DEFAULT_GALLERY_SETTINGS;
  const multicolumnSettings = siteSettings?.multicolumn ?? DEFAULT_MULTICOLUMN_SETTINGS;

  return (
    <>
      <Header settings={headerSettings} />
      <Carousel settings={carouselSettings} />
      <Video settings={videoSettings} />
      <Gallery settings={gallerySettings} />
      <Multicolumn settings={multicolumnSettings} />
      <Footer settings={footerSettings} />
    </>
  );
}
