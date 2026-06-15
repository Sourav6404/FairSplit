import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import onboardImg from "@/assets/onboard.png";
import onboard2Img from "@/assets/onboard2.png";
import onboard3Img from "@/assets/onboard3.png";

const features = [
  {
    title: "Smart Expense Sharing",
    description: "Split expenses easily with friends, family, roommates and colleagues using equal, percentage, share-based and custom splits.",
    buttonText: "Next",
    image: onboardImg
  },
  {
    title: "Multi-Currency Support",
    description: "Track expenses in multiple currencies with automatic conversions and accurate balance calculations.",
    buttonText: "Next",
    image: onboard2Img
  },
  {
    title: "Real-Time Balance Tracking",
    description: "Always know who owes whom with instant balance updates after every expense and settlement.",
    buttonText: "Continue",
    image: onboard3Img
  }
];

export function FeatureIntro() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < features.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-screen w-full overflow-hidden bg-white text-gray-900 p-6 relative">


      {/* Top Header */}
      <div className="w-full flex justify-end relative z-10">
        <button 
          onClick={() => navigate("/auth")} 
          className="text-gray-400 hover:text-gray-700 font-semibold text-sm px-4 py-2 rounded-full hover:bg-gray-100/50 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center text-center w-full"
          >
            <div className="relative w-full max-w-sm aspect-square max-h-[45vh] mb-6 flex items-center justify-center">
              <motion.img 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                src={features[currentStep].image} 
                alt="Feature Illustration" 
                className="w-full h-full object-contain relative z-10" 
              />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight text-gray-900">
              {features[currentStep].title}
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed max-w-sm">
              {features[currentStep].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-md pb-12 flex flex-col items-center relative z-10">
        
        {/* Pagination Dots */}
        <div className="flex gap-2.5 mb-10">
          {features.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-500 ease-out ${
                currentStep === idx 
                ? "w-8 bg-[#114b30]" 
                : "w-2 bg-gray-200 hover:bg-gray-300"
              }`}
            />
          ))}
        </div>
        
        {/* Next Button */}
        <button 
          onClick={handleNext}
          className="w-full h-14 rounded-full bg-[#114b30] hover:bg-[#155436] text-white font-bold text-lg shadow-[0_8px_30px_rgb(17,75,48,0.2)] hover:shadow-[0_12px_40px_rgb(17,75,48,0.3)] hover:-translate-y-0.5 transition-all duration-300"
        >
          {features[currentStep].buttonText}
        </button>
      </div>
    </div>
  );
}
