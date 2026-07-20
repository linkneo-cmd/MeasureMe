# MeasureMe
app打包，android目录下执行以下命令
./gradlew clean
./gradlew assembleDebug

# 代码变动后完整执行
npm run build && npx cap sync && cd android && ./gradlew assembleDebug