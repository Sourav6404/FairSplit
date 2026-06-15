import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";

export function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#0a1f14] overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-[#114b30]/40 blur-[120px] mix-blend-screen"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2] 
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-[#06b6d4]/20 blur-[100px] mix-blend-screen"
        />
        <div className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-t from-[#05100a] to-transparent"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center flex-1 justify-center w-full px-6">
        
        {/* Logo Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative mb-8"
        >
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            {/* Glow behind logo */}
            <div className="absolute inset-0 bg-[#22c55e] rounded-full blur-2xl opacity-40 scale-110"></div>
            
            {/* Logo */}
            <div className="w-28 h-28 rounded-[2rem] overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center shadow-2xl relative z-10">
              <img src={logo} alt="FairSplit Logo" className="w-full h-full object-cover rounded-[1.75rem]" />
            </div>
            
            {/* Sparkle decoration */}
            <motion.div 
              initial={{ opacity: 0, scale: 0, rotate: -45 }}
              animate={{ opacity: 1, scale: 1, rotate: 15 }}
              transition={{ delay: 1, duration: 0.5, type: "spring" }}
              className="absolute -top-3 -right-3 text-[#86efac]"
            >
              <Sparkles size={24} />
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="text-center max-w-lg"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
            FairSplit
          </h1>
          <p className="text-gray-300/80 text-lg md:text-xl text-center leading-relaxed font-medium">
            The smartest way to share expenses with anyone, anywhere. No stress, just fairness.
          </p>
        </motion.div>
      </div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm pb-16 px-6"
      >
        <button 
          onClick={() => navigate("/intro")}
          className="group relative w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#114b30] to-[#155436] hover:from-[#155436] hover:to-[#1a6541] text-white text-lg font-semibold h-16 rounded-full shadow-[0_0_40px_rgba(17,75,48,0.4)] hover:shadow-[0_0_60px_rgba(34,197,94,0.4)] transition-all duration-300 border border-white/10 overflow-hidden"
        >
          {/* Button inner shine */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          
          <span className="relative z-10">Get Started</span>
          <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>

      {/* Global styles for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
