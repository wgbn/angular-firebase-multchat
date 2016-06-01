# android: 4pp@v1v4s4lute! ios: 4pp10S@v1v4salut3
rm viva-chat.apk
ionic build android --release
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore vivakey.keystore platforms/android/build/outputs/apk/android-release-unsigned.apk vivasalute
~/Android/Sdk/build-tools/23.0.1/zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk viva-chat.apk
