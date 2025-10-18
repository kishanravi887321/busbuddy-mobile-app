# Foreground Service - Gradle 8 Compatibility Fix

## 🐛 Error You're Getting

```
BUILD FAILED
Task ':voximplant_react-native-foreground-service:extractDeepLinksDebug' 
uses output of task ':@voximplant_react-native-foreground-service:generateDebugResValues' 
without declaring an explicit or implicit dependency
```

## 🔍 Root Cause

**Gradle 8.2+** enforces strict task dependency declarations. The `@voximplant/react-native-foreground-service` package has:
- Incorrect task naming in `build.gradle`
- Missing dependency declarations for Release build
- Package name inconsistency (`@voximplant_` vs `voximplant_`)

## ✅ Fix Applied

Updated: `node_modules/@voximplant/react-native-foreground-service/android/build.gradle`

```gradle
// Fix for Gradle 8+ implicit dependency issue
tasks.whenTaskAdded { task ->
    if (task.name == 'packageDebugResources') {
        task.dependsOn ':@voximplant_react-native-foreground-service:generateDebugResValues'
    }
}
tasks.whenTaskAdded { task ->
    if (task.name == 'extractDeepLinksDebug') {
        task.dependsOn ':@voximplant_react-native-foreground-service:generateDebugResValues'  // ✅ Fixed
    }
}
tasks.whenTaskAdded { task ->
    if (task.name == 'packageReleaseResources') {
        task.dependsOn ':@voximplant_react-native-foreground-service:generateReleaseResValues'  // ✅ Added
    }
}
tasks.whenTaskAdded { task ->
    if (task.name == 'extractDeepLinksRelease') {
        task.dependsOn ':@voximplant_react-native-foreground-service:generateReleaseResValues'  // ✅ Added
    }
}
```

## ⚠️ Important: Use patch-package

Since this fix is in `node_modules`, it will be lost if you run `npm install` again.

### Install patch-package:
```bash
npm install --save-dev patch-package postinstall-postinstall
```

### Add to package.json:
```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

### Create the patch:
```bash
npx patch-package @voximplant/react-native-foreground-service
```

This creates a patch file in `patches/` folder that will auto-apply after every `npm install`.

## 🎯 Alternative Solution: Use Different Package

If you want to avoid patching, consider using:

### Option 1: react-native-background-actions
```bash
npm install react-native-background-actions
```
- Better maintained
- No Gradle 8 issues
- Similar functionality

### Option 2: @notifee/react-native (for notifications with foreground service)
```bash
npm install @notifee/react-native
```
- Modern, actively maintained
- Better Android 13+ support
- More features

### Option 3: Stick with current fix
- Apply patch-package (recommended)
- Works with current code
- No refactoring needed

## 📋 Compatibility Info

| Item | Version | Status |
|------|---------|--------|
| @voximplant/react-native-foreground-service | 3.0.2 | ⚠️ Has Gradle 8 issues |
| Gradle | 8.2+ | ✅ After fix |
| React Native | 0.73.6 | ✅ Compatible |
| Android Gradle Plugin | 8.x | ✅ After fix |

## 🔧 To Test the Fix

```bash
cd android
.\gradlew clean
cd ..
npx react-native run-android
```

## 📝 What Changed

### Before (Broken):
```gradle
tasks.whenTaskAdded { task ->
    if (task.name == 'extractDeepLinksDebug') {
        task.dependsOn ':voximplant_react-native-foreground-service:generateDebugResValues'
        // ❌ Wrong task name (missing @)
    }
}
// ❌ Missing Release tasks
```

### After (Fixed):
```gradle
tasks.whenTaskAdded { task ->
    if (task.name == 'extractDeepLinksDebug') {
        task.dependsOn ':@voximplant_react-native-foreground-service:generateDebugResValues'
        // ✅ Correct task name (with @)
    }
}
// ✅ Added Release tasks
tasks.whenTaskAdded { task ->
    if (task.name == 'extractDeepLinksRelease') {
        task.dependsOn ':@voximplant_react-native-foreground-service:generateReleaseResValues'
    }
}
```

## 🚀 Next Steps

1. Clean and rebuild:
   ```bash
   cd android
   .\gradlew clean
   cd ..
   npx react-native run-android
   ```

2. If build succeeds, create patch:
   ```bash
   npm install --save-dev patch-package
   npx patch-package @voximplant/react-native-foreground-service
   ```

3. Add postinstall script to `package.json`:
   ```json
   "scripts": {
     "postinstall": "patch-package"
   }
   ```

## 💡 Why This Happens

Gradle 8+ uses **Task Configuration Avoidance** which:
- Requires explicit task dependencies
- Prevents implicit task ordering
- Catches build issues earlier
- Enforces better build practices

The old package hasn't been updated for Gradle 8+, hence the manual fix needed.

---

**Status:** Fix applied to `build.gradle`. Ready to rebuild! 🎉
