from PIL import Image

img_path = r"C:\Users\Rupesh\.gemini\antigravity\brain\628a921f-4482-40ec-8894-e4d6a789c43e\vote_ink_cursor_1777718444398.png"
out_path = r"c:\VoterSaathi\VoterSaathi\assets\cursor.png"

img = Image.open(img_path)
img = img.convert("RGBA")
datas = img.getdata()

newData = []
for item in datas:
    # If it's close to white
    if item[0] > 240 and item[1] > 240 and item[2] > 240:
        newData.append((255, 255, 255, 0))
    else:
        newData.append(item)

img.putdata(newData)
# Resize to 32x32 for cursor
img = img.resize((32, 32), Image.Resampling.LANCZOS)
img.save(out_path, "PNG")
print("Cursor processed successfully.")
