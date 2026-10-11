import unittest
import requests
import json
from fastapi.testclient import TestClient
from backend.app.main import app

class TestVoiceActualTranscriptWorkflow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_telugu_govt_hospital_voice_query(self):
        """User speaks: 'నాకు దగ్గరలో ఉన్న ప్రభుత్వ ఆసుపత్రులు చూపించు'"""
        spoken_text = "నాకు దగ్గరలో ఉన్న ప్రభుత్వ ఆసుపత్రులు చూపించు"
        payload = {
            "message": spoken_text,
            "city": "Hyderabad",
            "history": [],
            "language": "te-IN"
        }
        res = self.client.post("/api/chat/guided", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # The AI response must directly address government hospitals and the user's query
        self.assertIn("ప్రభుత్వ", data["reply"])
        self.assertFalse(data.get("emergency_detected"))
        # It must not be a generic greeting or placeholder
        self.assertNotIn("ఈ ప్రిస్క్రిప్షన్‌ను పరిశీలించి", data["reply"])

        # Hospitals card must include genuine Government facilities
        hospitals = data.get("hospitals_card", [])
        self.assertGreater(len(hospitals), 0)
        for h in hospitals:
            self.assertEqual(h["ownership"], "Government", f"Expected Government hospital, got {h['ownership']}")

    def test_02_english_cataract_cost_voice_query(self):
        """User speaks: 'What is the estimated cost of cataract surgery?'"""
        spoken_text = "What is the estimated cost of cataract surgery?"
        payload = {
            "message": spoken_text,
            "city": "Hyderabad",
            "history": [],
            "language": "en-IN"
        }
        res = self.client.post("/api/chat/guided", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Must recognize cataract surgery and explain cost
        self.assertTrue(
            "Cataract" in data["reply"] or "cataract" in data["reply"].lower() or "eye" in data["reply"].lower(),
            f"Expected Cataract explanation, got {data['reply']}"
        )
        self.assertIn("₹", data["reply"])
        self.assertFalse(data.get("emergency_detected"))

    def test_03_mixed_code_switched_knee_cost_voice_query(self):
        """User speaks mixed Telugu-English: 'నాకు knee replacement cost ఎంత అవుతుంది?'"""
        spoken_text = "నాకు knee replacement cost ఎంత అవుతుంది?"
        payload = {
            "message": spoken_text,
            "city": "Hyderabad",
            "history": [],
            "language": "te-IN"
        }
        res = self.client.post("/api/chat/guided", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Must address knee replacement and costs
        self.assertTrue(
            "మోకాలి" in data["reply"] or "knee" in data["reply"].lower(),
            f"Expected knee replacement details, got {data['reply']}"
        )
        self.assertIn("₹", data["reply"])

    def test_04_no_dummy_transcription_substitution(self):
        """When empty/silence audio is sent to /api/speech/transcribe, no fake transcript should be returned."""
        # Send minimal audio header without voice
        payload = {
            "audio_base64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
            "language": "te-IN",
            "format": "wav"
        }
        res = self.client.post("/api/speech/transcribe", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Must NOT return hardcoded mock sentences
        self.assertNotEqual(data.get("transcript"), "నాకు మోకాలి ఆపరేషన్ చేయించుకోవాలి. హైదరాబాద్లో గవర్నమెంట్ హాస్పిటల్లో ఎంత ఖర్చు అవుతుంది?")
        self.assertNotEqual(data.get("transcript"), "I need a knee replacement in Hyderabad under 2 lakhs")
        # Must be untranscribed or clean error message
        self.assertIn(data.get("status"), ["untranscribed", "no_speech"])

    def test_05_consecutive_recordings_do_not_bleed_state(self):
        """User speaks query 1, then speaks query 2: each receives distinct relevant answers."""
        # Turn 1
        q1 = "నాకు దగ్గరలో ఉన్న ప్రభుత్వ ఆసుపత్రులు చూపించు"
        res1 = self.client.post("/api/chat/guided", json={"message": q1, "city": "Hyderabad", "language": "te-IN"})
        d1 = res1.json()

        # Turn 2: User changes topic completely to cataract cost
        q2 = "What is the estimated cost of cataract surgery?"
        history = [
            {"role": "user", "content": q1},
            {"role": "assistant", "content": d1["reply"]}
        ]
        res2 = self.client.post("/api/chat/guided", json={"message": q2, "city": "Hyderabad", "history": history, "language": "en-IN"})
        d2 = res2.json()

        # Turn 2 must respond to cataract, not re-hash government hospital list
        self.assertTrue("Cataract" in d2["reply"] or "cataract" in d2["reply"].lower())
        self.assertIn("Phaco", d2["reply"])

if __name__ == "__main__":
    unittest.main()
