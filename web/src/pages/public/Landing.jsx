import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

const fadeUp = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.55, ease: 'easeOut' },
}

const HERO_VIDEO_URL =
  'https://videos.pexels.com/video-files/36472453/15465549_2560_1440_60fps.mp4'
const HERO_POSTER_URL = '/travel-view.jpg'

const Landing = () => {
  return (
    <div className="bg-[#f8f5f0] text-[#1f1f1f]">
      <section className="relative overflow-hidden border-b border-[#eadfce]">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          poster={HERO_POSTER_URL}
        >
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(120deg, rgba(22, 15, 10, 0.72), rgba(183, 93, 30, 0.52)), radial-gradient(circle at 14% 20%, rgba(255, 122, 26, 0.28), transparent 40%)',
          }}
        />

        <div className="relative mx-auto grid min-h-[calc(100svh-64px)] w-full max-w-6xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="z-10"
          >
            <p className="mb-4 inline-flex rounded-full border border-[#f0d9bf]/50 bg-[#fff7ed]/92 px-4 py-1.5 text-xs font-semibold tracking-[0.12em] text-[#a85c24] uppercase">
              Built for travelers and local businesses
            </p>
            <h1 className="mb-4 text-4xl leading-tight font-semibold text-[#fff5e8] md:text-5xl lg:text-6xl">
              Discover Cebu.
              <br />
              Grow local stores.
              <br />
              All in one platform.
            </h1>
            <p className="max-w-xl text-base leading-7 text-[#ffe9d0] md:text-lg">
              Tara Bisita connects customers with trusted food spots and tourism experiences,
              while giving small businesses tools to manage menus, orders, insights, and billing.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="rounded-full bg-[#ff7a1a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#eb6c12]"
              >
                Create your account
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-[#ffdfbe] bg-white/92 px-6 py-3 text-sm font-semibold text-[#3d352d] transition hover:border-[#c66b2b] hover:text-[#c66b2b]"
              >
                Sign in
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-3xl border border-[#f0d8c0]/55 shadow-[0_30px_80px_-35px_rgba(90,45,20,0.45)]">
              <img
                src={HERO_POSTER_URL}
                alt="Cebu travel view"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,10,7,0.15),rgba(32,18,10,0.72))]" />
              <div className="relative flex min-h-[460px] flex-col justify-end p-7 text-[#fff6e9]">
                <p className="mb-2 text-xs tracking-[0.18em] uppercase">Cebu Experience</p>
                <h2 className="text-3xl leading-tight font-semibold">
                  Start your journey and support local entrepreneurs.
                </h2>
                <p className="mt-3 max-w-md text-sm text-[#ffedd8]">
                  Explore destinations, browse menus, and order from your next favorite business.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 lg:px-10">
        <motion.div {...fadeUp} className="mb-8 text-center">
          <h3 className="text-3xl font-semibold text-[#231d18]">What Tara Bisita is all about</h3>
          <p className="mx-auto mt-3 max-w-2xl text-[#6f675e]">
            A connected ecosystem for tourists and communities, helping customers discover better
            options while helping businesses grow with confidence.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: 'For Customers',
              body: 'Find places faster, compare offers, check details, and order with a smooth and simple flow.',
            },
            {
              title: 'For Small Businesses',
              body: 'Manage your profile, menus, orders, and reports from one modern dashboard built for daily operations.',
            },
            {
              title: 'For Local Economy',
              body: 'Increase visibility of local stores and destinations to help communities earn and thrive.',
            },
          ].map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: 0.08 * index, ease: 'easeOut' }}
              className="rounded-2xl border border-[#e7dccd] bg-white p-6 shadow-[0_16px_36px_-28px_rgba(73,45,20,0.52)]"
            >
              <h4 className="mb-2 text-lg font-semibold text-[#2a2119]">{item.title}</h4>
              <p className="text-sm leading-7 text-[#6d665e]">{item.body}</p>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Landing
