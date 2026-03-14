import { Suspense } from "react";
import { Header } from "@/components/sections/header";
import { Footer } from "@/components/sections/footer";
import { Carousel } from "@/components/sections/carousel";
import { Video } from "@/components/sections/video";
import { Gallery } from "@/components/sections/gallery";
import { Multicolumn } from "@/components/sections/multicolumn";
import { Map } from "@/components/sections/map";
import { Booking } from "@/components/sections/booking";
import { Ranking } from "@/components/sections/ranking";
import { AnimateOnScroll } from "@/components/ui";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { generateThemeCss } from "@/lib/theme";
import { DEFAULT_HEADER_SETTINGS, DEFAULT_FOOTER_SETTINGS, DEFAULT_CAROUSEL_SETTINGS, DEFAULT_VIDEO_SETTINGS, DEFAULT_GALLERY_SETTINGS, DEFAULT_MULTICOLUMN_SETTINGS, DEFAULT_MAP_SETTINGS, DEFAULT_THEME_SETTINGS } from "@/types";

export default async function Home() {
  const siteSettings = await getSiteSettings();
  const headerSettings = siteSettings?.header ?? DEFAULT_HEADER_SETTINGS;
  const footerSettings = siteSettings?.footer ?? DEFAULT_FOOTER_SETTINGS;
  const carouselSettings = siteSettings?.carousel ?? DEFAULT_CAROUSEL_SETTINGS;
  const videoSettings = siteSettings?.video ?? DEFAULT_VIDEO_SETTINGS;
  const gallerySettings = siteSettings?.gallery ?? DEFAULT_GALLERY_SETTINGS;
  const multicolumnSettings = siteSettings?.multicolumn ?? DEFAULT_MULTICOLUMN_SETTINGS;
  const mapSettings = siteSettings?.map ?? DEFAULT_MAP_SETTINGS;
  const themeSettings = siteSettings?.theme ?? DEFAULT_THEME_SETTINGS;
  const themeCss = generateThemeCss(themeSettings);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      <Header settings={headerSettings} />
      <main>
        <Suspense>
          <AnimateOnScroll>
            <Booking />
          </AnimateOnScroll>
        </Suspense>
        <AnimateOnScroll>
          <Carousel settings={carouselSettings} />
        </AnimateOnScroll>
        <AnimateOnScroll>
          <Video settings={videoSettings} />
        </AnimateOnScroll>
        <AnimateOnScroll>
          <Gallery settings={gallerySettings} />
        </AnimateOnScroll>
        <AnimateOnScroll>
          <Multicolumn settings={multicolumnSettings} />
        </AnimateOnScroll>
        <AnimateOnScroll>
          <Map settings={mapSettings} />
        </AnimateOnScroll>
        <Suspense>
          <AnimateOnScroll>
            <Ranking />
          </AnimateOnScroll>
        </Suspense>
      </main>
      <AnimateOnScroll>
        <Footer settings={footerSettings} />
      </AnimateOnScroll>
    </>
  );
}
