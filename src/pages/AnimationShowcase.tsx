import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AnimatedCard,
  AnimatedButton,
  StaggeredList,
  StaggeredItem,
  FadeIn,
  SlideIn,
  AnimatedCounter,
  AnimatedIcon,
  AnimatedModal,
  AnimatedNotification,
  AnimatedProgress
} from '../components/AnimatedComponents';
import { SkeletonCard, SkeletonChart, SkeletonTable } from '../components/LoadingSpinner';
import { Play, Pause, RotateCcw, Sparkles, Heart, Star, Zap } from 'lucide-react';

const AnimationShowcase: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleProgressDemo = () => {
    setIsPlaying(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsPlaying(false);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const resetProgress = () => {
    setProgress(0);
    setIsPlaying(false);
  };

  const demoCards = [
    { title: 'Revenue', value: 125000, icon: Sparkles, color: 'text-green-600' },
    { title: 'Orders', value: 1250, icon: Heart, color: 'text-blue-600' },
    { title: 'Customers', value: 850, icon: Star, color: 'text-purple-600' },
    { title: 'Growth', value: 25, icon: Zap, color: 'text-orange-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <FadeIn>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1 
              className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              Animation Showcase
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Experience the comprehensive animation system implemented throughout the Ecom Ecosystem project.
              From micro-interactions to complex page transitions, every element is designed to enhance user experience.
            </motion.p>
          </motion.div>

          {/* Animation Controls */}
          <SlideIn direction="up" delay={0.2}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <AnimatedIcon icon={Play} className="mr-3 text-blue-600" />
                Interactive Demos
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnimatedButton
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  Show Modal
                </AnimatedButton>
                
                <AnimatedButton
                  onClick={() => setShowNotification(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  Show Notification
                </AnimatedButton>
                
                <AnimatedButton
                  onClick={() => setShowSkeleton(!showSkeleton)}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                >
                  Toggle Skeleton
                </AnimatedButton>
                
                <AnimatedButton
                  onClick={isPlaying ? resetProgress : handleProgressDemo}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <AnimatedIcon icon={isPlaying ? RotateCcw : Play} className="mr-2" />
                  {isPlaying ? 'Reset' : 'Progress Demo'}
                </AnimatedButton>
              </div>
              
              {/* Progress Demo */}
              <motion.div 
                className="mt-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ 
                  opacity: progress > 0 ? 1 : 0, 
                  height: progress > 0 ? 'auto' : 0 
                }}
                transition={{ duration: 0.3 }}
              >
                <AnimatedProgress 
                  value={progress} 
                  className="mb-2" 
                  showPercentage 
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Progress: {progress}%
                </p>
              </motion.div>
            </div>
          </SlideIn>

          {/* Animated Cards Grid */}
          <SlideIn direction="left" delay={0.4}>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <AnimatedIcon icon={Sparkles} className="mr-3 text-purple-600" />
                Animated KPI Cards
              </h2>
              
              <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {demoCards.map((card, index) => (
                  <StaggeredItem key={index}>
                    <AnimatedCard className="p-6 text-center hover:shadow-2xl transition-shadow duration-300">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4"
                      >
                        <card.icon className={`h-12 w-12 mx-auto ${card.color}`} />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {card.title}
                      </h3>
                      <AnimatedCounter 
                        value={card.value} 
                        className="text-3xl font-bold text-gray-900 dark:text-white"
                        duration={2}
                      />
                    </AnimatedCard>
                  </StaggeredItem>
                ))}
              </StaggeredList>
            </div>
          </SlideIn>

          {/* Skeleton Loading Demo */}
          <SlideIn direction="right" delay={0.6}>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Loading States & Skeletons
              </h2>
              
              <AnimatePresence mode="wait">
                {showSkeleton ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                    <SkeletonChart />
                    <SkeletonTable rows={4} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                    <AnimatedCard className="p-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Sample Chart
                      </h3>
                      <div className="h-64 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 180, 360]
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Sparkles className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                        </motion.div>
                      </div>
                    </AnimatedCard>
                    
                    <AnimatedCard className="p-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Sample Data Table
                      </h3>
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map((item, index) => (
                          <motion.div
                            key={item}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                            whileHover={{ scale: 1.02, x: 4 }}
                          >
                            <span className="text-gray-900 dark:text-white">Item {item}</span>
                            <motion.span 
                              className="text-blue-600 dark:text-blue-400 font-semibold"
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              ${(Math.random() * 1000).toFixed(2)}
                            </motion.span>
                          </motion.div>
                        ))}
                      </div>
                    </AnimatedCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </SlideIn>

          {/* Animation Features List */}
          <FadeIn delay={0.8}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                🎨 Animation Features Implemented
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'Page Transitions', desc: 'Smooth route changes with AnimatePresence' },
                  { title: 'Component Animations', desc: 'Cards, buttons, and interactive elements' },
                  { title: 'Loading States', desc: 'Skeleton screens and progress indicators' },
                  { title: 'Micro-interactions', desc: 'Hover effects and button animations' },
                  { title: 'Staggered Lists', desc: 'Sequential item animations' },
                  { title: 'Data Visualization', desc: 'Animated counters and charts' },
                  { title: 'Modal & Notifications', desc: 'Entrance and exit animations' },
                  { title: 'Dark Mode Support', desc: 'Seamless theme transitions' },
                  { title: 'Accessibility', desc: 'Respects reduced motion preferences' }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {feature.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </FadeIn>

      {/* Modal Demo */}
      <AnimatePresence>
        {showModal && (
          <AnimatedModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title="Animation Demo Modal"
          >
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This modal demonstrates smooth entrance and exit animations with backdrop blur effects.
              </p>
              <motion.div
                className="flex justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-12 w-12 text-blue-600" />
              </motion.div>
            </div>
          </AnimatedModal>
        )}
      </AnimatePresence>

      {/* Notification Demo */}
      <AnimatePresence>
        {showNotification && (
          <AnimatedNotification
            type="success"
            title="Animation Success!"
            message="All animations are working perfectly across the application."
            onClose={() => setShowNotification(false)}
            autoClose={3000}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimationShowcase;