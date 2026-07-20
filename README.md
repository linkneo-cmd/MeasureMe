# MeasureMe 项目介绍
有没有这样一款app or 网页，用来记录家里家具的尺寸，方便刷购物软件看到心动的东西时，随时查阅比对
## 背景：
事情的起因是我在公司午休刷购物软件的时候，看到一个桌面增高架，有大中小三个尺寸，价格和外观都挺让我心动，但我当时无法随手测量一下家里桌子的长宽高，我不知道该买哪个尺寸的，我又是一个怕麻烦的人。不想买了尺寸不合适又去换货又去退，于是我避免了一次冲动购物，但也可能错过了一次提升生活幸福感的机会

因此我希望有这么一款app或者小程序，可以记录下生活中的一些关键尺寸：桌子的长宽、行李箱的高宽、自己的臂长、恋人的腕围，指围等。让以后每一次提升生活幸福感的机会来临时，不因为关键数据的缺失，导致错过

# MeasureMe
app打包，android目录下执行以下命令
./gradlew clean
./gradlew assembleDebug

# 代码变动后完整执行
npm run build && npx cap sync && cd android && ./gradlew assembleDebug

# 更换图标
@capacitor/assets 工具是最高效的方式。以后每次想换图标，只需覆盖 assets/icon.png 文件，然后重新执行 npx @capacitor/assets generate --android 和 npx cap sync 即可。