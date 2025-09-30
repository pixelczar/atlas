import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AtlasLogo } from '@/components/ui/AtlasLogo';
import { Globe, Map, Users } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="dark relative min-h-screen bg-[#0a0a0a]">
      {/* Dot Grid Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="h-full w-full bg-[radial-gradient(#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-gray-800">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">
          <Link href="/">
            <AtlasLogo size="lg" className="text-gray-50" />
          </Link>
          <nav className="flex items-center gap-8">
            <Link
              href="/canvas"
              className="text-sm text-gray-400 transition-colors hover:text-gray-50"
            >
              Canvas
            </Link>
            <Link href="/auth">
              <Button
                variant="outline"
                className="border-gray-700 bg-transparent text-sm font-normal text-gray-300 hover:bg-gray-800 hover:text-gray-50"
              >
                Sign In
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-8 py-40">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          {/* Left: Text Content */}
          <div className="max-w-5xl">
            <h1 className="font-serif text-8xl leading-[0.95] tracking-tight text-gray-50 lg:text-9xl">
              Your sitemap,
            </h1>
            <h2 className="mt-2 font-serif text-8xl leading-[0.95] tracking-tight text-[#5B98D6] lg:text-9xl">
              visualized
            </h2>
            <p className="mt-12 max-w-xl text-xl leading-relaxed text-gray-400">
              Transform XML sitemaps into interactive, collaborative graphs. Preview
              pages with thumbnails or live iframes—all in real-time.
            </p>
            <div className="mt-16 flex gap-4">
              <Link href="/canvas">
                <Button
                  size="lg"
                  className="h-14 bg-[#4863B0] px-10 text-base font-normal text-white hover:bg-[#5B98D6]"
                >
                  Try Demo Canvas
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 border-gray-700 bg-transparent px-10 text-base font-normal text-gray-300 hover:bg-gray-800 hover:text-gray-50"
                >
                  View Projects
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Graphic */}
          <div className="relative flex items-center justify-end">
            <div className="absolute -right-32 -top-20 lg:relative lg:right-0 lg:top-0">
              <svg 
                width="480" 
                height="220" 
                viewBox="0 0 184 84" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="opacity-70"
              >
                <path d="M156.389 63.1657L111.259 18.0364C108.694 15.471 105.213 14.0284 101.585 14.0284L80.8326 14.0284C77.2046 14.0284 73.7233 12.587 71.158 10.0217L65.4326 4.29636C64.094 2.95769 65.0433 0.669688 66.9353 0.669688L79.242 0.669687C82.1393 0.669687 84.9166 1.82036 86.9646 3.86836L89.25 6.15236C91.5633 8.46702 94.702 9.76702 97.974 9.76702L123.682 9.76702C127.31 9.76702 130.791 11.2084 133.357 13.7737L183.115 63.5323C184.453 64.871 183.507 67.159 181.614 67.1603L166.075 67.1737C162.442 67.1763 158.958 65.735 156.389 63.1657Z" fill="#9FC164" fillOpacity="0.4"/>
                <path d="M132.566 71.4114L87.4365 26.282C84.8712 23.7167 81.3899 22.274 77.7619 22.274L57.0099 22.274C53.3819 22.274 49.9005 20.8327 47.3352 18.2674L33.2765 4.29671C31.9379 2.95805 32.8859 0.668712 34.7792 0.668712L47.0859 0.668711C49.9819 0.668711 52.7592 1.81937 54.8072 3.86737L65.4259 14.398C67.7405 16.7127 70.8792 18.0127 74.1512 18.0127L99.8592 18.0127C103.487 18.0127 106.969 19.454 109.534 22.0194L159.293 71.778C160.63 73.1167 159.685 75.4047 157.791 75.406L142.253 75.4194C138.619 75.422 135.135 73.9807 132.566 71.4114Z" fill="#9FC164" fillOpacity="0.8"/>
                <path d="M108.743 79.6571L63.6138 34.5278C61.0485 31.9624 57.5671 30.5198 53.9391 30.5198L33.1871 30.5198C29.5591 30.5198 26.0778 29.0784 23.5125 26.5131L1.31511 4.31577C-0.0235561 2.9771 0.924442 0.689099 2.81778 0.689099L15.1244 0.689097C18.0218 0.689097 20.7991 1.83843 22.8471 3.88643L41.6031 22.6438C43.9178 24.9584 47.0565 26.2584 50.3285 26.2584L76.0364 26.2584C79.6644 26.2584 83.1458 27.6998 85.7111 30.2651L135.47 80.0238C136.807 81.3624 135.862 83.6504 133.968 83.6517L118.43 83.6651C114.796 83.6678 111.312 82.2264 108.743 79.6571Z" fill="#9FC164" fillOpacity="1"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-8 py-32">
          <div className="mb-20">
            <h3 className="font-serif text-5xl tracking-tight text-gray-50">
              Features
            </h3>
          </div>
          <div className="grid gap-x-16 gap-y-20 md:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg border border-[#5B98D6]/20 bg-[#5B98D6]/10">
                <Globe className="h-6 w-6 text-[#5B98D6]" strokeWidth={1.5} />
              </div>
              <h4 className="mb-3 text-xl font-medium text-gray-50">
                Sitemap Import
              </h4>
              <p className="text-base leading-relaxed text-gray-400">
                Parse WordPress XML sitemaps and visualize site structure
              </p>
            </div>

            {/* Feature 2 */}
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg border border-[#5B98D6]/20 bg-[#5B98D6]/10">
                <svg
                  className="h-6 w-6 text-[#5B98D6]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                  />
                </svg>
              </div>
              <h4 className="mb-3 text-xl font-medium text-gray-50">
                Live Previews
              </h4>
              <p className="text-base leading-relaxed text-gray-400">
                Toggle between thumbnails and iframe previews instantly
              </p>
            </div>

            {/* Feature 3 */}
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg border border-[#9FC164]/20 bg-[#9FC164]/10">
                <Users className="h-6 w-6 text-[#9FC164]" strokeWidth={1.5} />
              </div>
              <h4 className="mb-3 text-xl font-medium text-gray-50">
                Realtime Collab
              </h4>
              <p className="text-base leading-relaxed text-gray-400">
                Work together with live updates via Firebase
              </p>
            </div>

            {/* Feature 4 */}
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg border border-[#CAD890]/30 bg-[#CAD890]/10">
                <Map className="h-6 w-6 text-[#CAD890]" strokeWidth={1.5} />
              </div>
              <h4 className="mb-3 text-xl font-medium text-gray-50">
                Interactive Graph
              </h4>
              <p className="text-base leading-relaxed text-gray-400">
                Zoom, pan, and organize with React Flow
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-gray-600" strokeWidth={1.5} />
              <span className="text-sm text-gray-500">
                Atlas - Visual Sitemap Explorer
              </span>
            </div>
            <p className="text-sm text-gray-600">© 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
}