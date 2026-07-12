#ifndef LOG_H
#define LOG_H

#include <Arduino.h>
#include "Config.h"

#ifdef LOG_ENABLED
  #define LOG_BEGIN(baud)   Serial.begin(baud)
  #define LOG_PRINT(...)    Serial.print(__VA_ARGS__)
  #define LOG_PRINTLN(...)  Serial.println(__VA_ARGS__)
  #define LOG_PRINTF(...)   Serial.printf(__VA_ARGS__)
#else
  #define LOG_BEGIN(baud)
  #define LOG_PRINT(...)
  #define LOG_PRINTLN(...)
  #define LOG_PRINTF(...)
#endif

#endif  // LOG_H
