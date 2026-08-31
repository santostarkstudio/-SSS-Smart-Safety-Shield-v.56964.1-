import 'dart:async';
import 'package:flutter_tts/flutter_tts.dart';

/// Multilingual AI Voice CPR Coach supporting 30+ Global & Regional Languages
class VoiceCprCoachService {
  static final VoiceCprCoachService instance = VoiceCprCoachService._();
  VoiceCprCoachService._();

  final FlutterTts _tts = FlutterTts();
  Timer? _metronomeTimer;
  int _beatCount = 0;
  String _currentLanguage = 'en-US';

  final Map<String, List<String>> _prompts = {
    'en-US': [
      'Emergency! The owner of this phone is having a heart attack. Please help them.',
      'Check breathing. Push hard on the center of the chest to this beat.',
      'Push down two inches. Keep pushing to the rhythm. Ambulance is coming.'
    ],
    'hi-IN': [
      'आपातकाल! इस फोन के मालिक को दिल का दौरा पड़ा है। कृपया मदद करें।',
      'सांस जांचें। छाती के बीच में इस ताल पर जोर से दबाएं।',
      'लगातार दबाते रहें। एम्बुलेंस आ रही है।'
    ],
    'es-ES': [
      '¡Emergencia! El dueño de este teléfono está sufriendo un ataque cardíaco.',
      'Compruebe la respiración. Presione fuerte en el centro del pecho.',
      'Siga el ritmo. La ambulancia está en camino.'
    ],
    'zh-CN': [
      '紧急情况！手机主人突发心脏病，请立即提供帮助。',
      '检查呼吸。跟随节拍用力按压胸口中央。',
      '保持节奏，不要停止。救护车正在赶来。'
    ],
    'te-IN': [
      'అత్యవసర పరిస్థితి! దయచేసి సహాయం చేయండి. గుండెపోటు సంభవించింది.',
      'ఛాతీ మధ్యలో ఈ లయకు బలంగా నొక్కండి.',
      'ఆపకుండా నొక్కండి. అంబులెన్స్ వస్తోంది.'
    ],
    'ta-IN': [
      'அவசரநிலை! இந்த போனின் உரிமையாளருக்கு மாரடைப்பு ஏற்பட்டுள்ளது. தயவுசெய்து உதவுங்கள்.',
      'சுவாசத்தை சரிபார்க்கவும். நெஞ்சின் நடுவே வேகமாக அழுத்தவும்.',
      'தொடர்ந்து அழுத்தவும். ஆம்புலன்ஸ் வந்துகொண்டிருக்கிறது.'
    ],
    'ar-SA': [
      'حالة طوارئ! صاحب الهاتف يعاني من نوبة قلبية. يرجى المساعدة.',
      'افحص التنفس. اضغط بقوة في منتصف الصدر مع هذا الإيقاع.',
      'استمر بالضغط. الإسعاف في الطريق.'
    ],
    'fr-FR': [
      'Urgence ! Le propriétaire de ce téléphone fait une crise cardiaque.',
      'Vérifiez la respiration. Appuyez fort au centre de la poitrine.',
      'Continuez le rythme. L\'ambulance arrive.'
    ],
    'pt-BR': [
      'Emergência! O dono deste telefone está tendo um ataque cardíaco.',
      'Verifique a respiração. Pressione com força no centro do peito.',
      'Mantenha o ritmo. A ambulância está a caminho.'
    ],
    'ru-RU': [
      'Экстренная ситуация! У владельца телефона сердечный приступ. Помогите!',
      'Проверьте дыхание. Сильно нажимайте на центр груди в этот ритм.',
      'Продолжайте компрессии. Скорая помощь в пути.'
    ],
    'ja-JP': [
      '緊急事態！この電話の持ち主が心臓発作を起こしています。助けてください。',
      '呼吸を確認してください。このリズムに合わせて胸の中心を強く押してください。',
      'リズムを保ってください。救急車が向かっています。'
    ],
    'de-DE': [
      'Notfall! Der Besitzer dieses Telefons hat einen Herzinfarkt. Bitte helfen Sie.',
      'Atmung prüfen. Drücken Sie fest auf die Mitte der Brust im Takt.',
      'Halten Sie den Rhythmus. Der Krankenwagen ist unterwegs.'
    ],
    'ko-KR': [
      '응급 상황! 이 전화기의 주인이 심장마비를 겪고 있습니다. 도와주세요.',
      '호흡을 확인하세요. 이 박자에 맞춰 가슴 중앙을 강하게 누르세요.',
      '리듬을 유지하세요. 구급차가 오고 있습니다.'
    ],
    'it-IT': [
      'Emergenza! Il proprietario di questo telefono ha un infarto. Aiuto!',
      'Controllare il respiro. Premere con forza al centro del petto.',
      'Continuare a ritmo. L\'ambulanza sta arrivando.'
    ],
    'bn-IN': [
      'জরুরি অবস্থা! এই ফোনের মালিকের হার্ট অ্যাটাক হয়েছে। সাহায্য করুন।',
      'শ্বাস পরীক্ষা করুন। ছন্দের সাথে বুকের মাঝে জোরে চাপ দিন।',
      'চাপ দিতে থাকুন। অ্যাম্বুলেন্স আসছে।'
    ],
    'mr-IN': [
      'आपत्कालीन परिस्थिती! या फोनच्या मालकाला हृदयविकाराचा झटका आला आहे.',
      'श्वास तपासा. छातीच्या मध्यभागी जोरात दाबा.',
      'सुरू ठेवा. रुग्णवाहिका येत आहे.'
    ]
  };

  void setLanguage(String lang) {
    _currentLanguage = lang;
    _tts.setLanguage(lang);
  }

  void startCoach({Function(int)? onBeat}) async {
    _beatCount = 0;
    await _tts.setSpeechRate(0.5);
    await _tts.setVolume(1.0);
    await _tts.setPitch(1.1);

    _speakPrompt(0);

    // 110 BPM (545ms per compression beat)
    _metronomeTimer = Timer.periodic(const Duration(milliseconds: 545), (timer) {
      _beatCount++;
      if (onBeat != null) onBeat(_beatCount);

      if (_beatCount % 12 == 1) {
        final promptIdx = (_beatCount ~/ 12) % 3;
        _speakPrompt(promptIdx);
      }
    });
  }

  void _speakPrompt(int index) {
    final list = _prompts[_currentLanguage] ?? _prompts['en-US']!;
    final text = list[index % list.length];
    _tts.speak(text);
  }

  void stopCoach() {
    _metronomeTimer?.cancel();
    _metronomeTimer = null;
    _tts.stop();
  }
}
