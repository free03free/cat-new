# === حماية عامة للإصدار النهائي ===
# حذف كل استدعاءات Log.* من الكود النهائي (لا تسريب معلومات تصحيح)
-assumenosideeffects class android.util.Log {
    public static *** v(...);
    public static *** d(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}

# تفعيل أقصى تحسين/تشويش ممكن من R8
-optimizationpasses 5
-allowaccessmodification
-repackageclasses ''

# === جسر WebView <-> JavaScript (Bridge في MainActivity) ===
# يجب إبقاء اسم الصنف والدوال المُعلَّمة JavascriptInterface كما هي
# وإلا فقدت صفحة الـ WebView القدرة على استدعائها بعد التشويش
-keepclassmembers class app.talkingcat.MainActivity$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class app.talkingcat.MainActivity$Bridge { *; }
-keepattributes JavascriptInterface

# === مكتبة sherpa-onnx (TTS) ===
# الكود الأصلي (JNI/.so) يستدعي هذه الأصناف بأسمائها مباشرة من C++،
# فيجب عدم تغيير أسماء الأصناف أو الحقول أو الدوال فيها
-keep class com.k2fsa.sherpa.onnx.** { *; }
-keepclassmembers class com.k2fsa.sherpa.onnx.** { *; }
-dontwarn com.k2fsa.sherpa.onnx.**

# إبقاء التوقيعات العامة والدوال الأصلية (native) في أي صنف
-keepclasseswithmembernames class * {
    native <methods>;
}

# إبقاء Parcelable / Serializable الاعتيادية (احتياط)
-keep class * implements android.os.Parcelable { *; }
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    !private <fields>;
    !private <methods>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# نقطة الدخول الرئيسية (Activity معلنة في Manifest فلا تُحذف أبدًا تلقائيًا، لكن توضيح لا يضر)
-keep class app.talkingcat.MainActivity { *; }
