import cv2
import face_recognition
import os
import numpy as np

class ReconhecedorFacial:
    def __init__(self, db_path="dataset/faces"):
        self.db_path = db_path

        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        self.conhecidos_encodings = []
        self.nomes_conhecidos = []
        self.carregar_dataset()

    def carregar_dataset(self):
        """Carrega fotos e gera encodings na inicialização."""
        print("Carregando rostos do dataset...")
        if not os.path.exists(self.db_path):
            os.makedirs(self.db_path)
            
        for arquivo in os.listdir(self.db_path):
            if arquivo.endswith(('.jpg', '.png', '.jpeg')):
                caminho = os.path.join(self.db_path, arquivo)
                img = face_recognition.load_image_file(caminho)
                encodings = face_recognition.face_encodings(img)
                
                if len(encodings) > 0:
                    self.conhecidos_encodings.append(encodings[0])
                    self.nomes_conhecidos.append(os.path.splitext(arquivo)[0])
        print(f"Total de funcionários carregados: {len(self.nomes_conhecidos)}")

    def identificar_pessoa(self, frame):
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        rostos = self.face_cascade.detectMultiScale(gray, 
            scaleFactor=1.05, 
            minNeighbors=3, 
            minSize=(30, 30))
        
        
        for (x, y, w, h) in rostos:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
        
        # Mostra o frame na tela de debug
        cv2.imshow("Debug de Detecção", frame)
        cv2.waitKey(1)
        

        if len(rostos) == 0:
            return "Desconhecido"
        
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            encodings_frame = face_recognition.face_encodings(rgb_frame)
            
            for encoding in encodings_frame:
                matches = face_recognition.compare_faces(self.conhecidos_encodings, encoding, tolerance=0.6)
                if True in matches:
                    index = matches.index(True)
                    return self.nomes_conhecidos[index]
            
            return "Desconhecido"
        except Exception as e:
            print(f"Erro na identificação: {e}")
            return "Desconhecido"