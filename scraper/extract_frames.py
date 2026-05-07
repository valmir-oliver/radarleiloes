import cv2
import os

video_path = r"C:\Users\valmi\AppData\Local\Packages\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\LocalState\sessions\E62DF43A5C22C97A226C814157F1B855EF052EDD\transfers\2026-19\WhatsApp Video 2026-05-06 at 21.45.30.mp4"
output_dir = r"e:\App-Lovable\PROJETOS\siteleiloes\extracted_frames"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

print(f"Abrindo vídeo: {video_path}")
cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    print("Erro ao abrir arquivo de vídeo")
    exit(1)

total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = cap.get(cv2.CAP_PROP_FPS)
duration = total_frames / fps if fps > 0 else 0

print(f"Total de frames: {total_frames}")
print(f"FPS: {fps}")
print(f"Duração: {duration:.2f}s")

# Extrair 8 frames distribuídos uniformemente
num_frames_to_extract = 8
for i in range(num_frames_to_extract):
    fraction = i / (num_frames_to_extract - 1) if num_frames_to_extract > 1 else 0.5
    target_frame = int(fraction * (total_frames - 1))
    
    cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
    ret, frame = cap.read()
    
    if ret:
        output_path = os.path.join(output_dir, f"frame_{i:02d}.jpg")
        cv2.imwrite(output_path, frame)
        print(f"Frame {i} (frame #{target_frame}) extraído com sucesso para: {output_path}")
    else:
        print(f"Erro ao ler frame #{target_frame}")

cap.release()
print("Extração concluída!")
