import os, struct, json
import numpy as np
from PIL import Image

src_glb = r'c:\Users\Soumik\Downloads\a372ab30971fac05c44d581e34445adb.glb'
src_img = r'C:/Users/Soumik/.gemini/antigravity/brain/1702f396-9477-42c7-bb94-8cedbdde33d2/.user_uploaded/media_1794831547441_7ec82020.jpg'

# 1. Read original GLB
with open(src_glb, 'rb') as f:
    magic, version, length = struct.unpack('<4sII', f.read(12))
    chunk_len, _ = struct.unpack('<II', f.read(8))
    json_data = json.loads(f.read(chunk_len).decode('utf-8'))
    bin_len, _ = struct.unpack('<II', f.read(8))
    bin_data = f.read(bin_len)

# Extract indices
idx_acc = json_data['accessors'][0]
idx_bv = json_data['bufferViews'][idx_acc['bufferView']]
idx_count = idx_acc['count']
indices = np.frombuffer(bin_data[idx_bv.get('byteOffset', 0):idx_bv.get('byteOffset', 0) + idx_count * 4], dtype=np.uint32).reshape(-1, 3)

# Extract positions
pos_acc = json_data['accessors'][1]
pos_bv = json_data['bufferViews'][pos_acc['bufferView']]
pos_count = pos_acc['count']
vertices = np.frombuffer(bin_data[pos_bv.get('byteOffset', 0):pos_bv.get('byteOffset', 0) + pos_count * 12], dtype=np.float32).reshape(-1, 3).copy()

print(f"Loaded GLB: {len(vertices)} vertices, {len(indices)} triangles")

# Global bounding box for UV projection
g_min = vertices.min(axis=0)
g_max = vertices.max(axis=0)
print(f"Global bounds: X[{g_min[0]:.3f}, {g_max[0]:.3f}], Y[{g_min[1]:.3f}, {g_max[1]:.3f}], Z[{g_min[2]:.3f}, {g_max[2]:.3f}]")

# Load and crop textures for each character
img = Image.open(src_img).convert('RGBA')
img_w, img_h = img.size

# Character split boundaries along X
splits = [
    ("detective", -0.505, -0.255),
    ("wizard",    -0.255,  0.025),
    ("explorer",   0.025,  0.245),
    ("golem",      0.245,  0.505)
]

def export_character_glb(name, x_min_b, x_max_b):
    # Select triangles whose centroid falls in this X range
    tri_centroids_x = vertices[indices].mean(axis=1)[:, 0]
    mask = (tri_centroids_x >= x_min_b) & (tri_centroids_x < x_max_b)
    char_tris = indices[mask]

    # Remap active vertices
    active_v_indices, new_idx = np.unique(char_tris, return_inverse=True)
    char_tris_remapped = new_idx.reshape(-1, 3).astype(np.uint32)
    char_verts = vertices[active_v_indices].copy()

    # UV Mapping: project from 2D image coordinates
    # U maps horizontally from global min_x to max_x
    # V maps vertically (in glTF, V=0 is top, V=1 is bottom or vice versa)
    u = (char_verts[:, 0] - g_min[0]) / (g_max[0] - g_min[0])
    # The character occupies roughly y from min_y to max_y; map to image Y
    v = 1.0 - (char_verts[:, 1] - g_min[1]) / (g_max[1] - g_min[1])
    char_uvs = np.column_stack([u, v]).astype(np.float32)

    # Compute smooth vertex normals
    v0 = char_verts[char_tris_remapped[:, 0]]
    v1 = char_verts[char_tris_remapped[:, 1]]
    v2 = char_verts[char_tris_remapped[:, 2]]
    face_normals = np.cross(v1 - v0, v2 - v0)
    norm_lens = np.linalg.norm(face_normals, axis=1, keepdims=True)
    norm_lens[norm_lens == 0] = 1.0
    face_normals /= norm_lens

    char_normals = np.zeros_like(char_verts)
    for i in range(3):
        np.add.at(char_normals, char_tris_remapped[:, i], face_normals)
    v_norm_lens = np.linalg.norm(char_normals, axis=1, keepdims=True)
    v_norm_lens[v_norm_lens == 0] = 1.0
    char_normals /= v_norm_lens
    char_normals = char_normals.astype(np.float32)

    # Center character: center X, center Z, feet on ground (min Y = 0)
    # Scale to ~3.2 units tall (fighting game character size)
    height = char_verts[:, 1].max() - char_verts[:, 1].min()
    scale = 3.2 / height

    char_verts[:, 0] -= (char_verts[:, 0].min() + char_verts[:, 0].max()) / 2.0
    char_verts[:, 2] -= (char_verts[:, 2].min() + char_verts[:, 2].max()) / 2.0
    char_verts[:, 1] -= char_verts[:, 1].min()
    char_verts *= scale

    # Crop and save individual character texture
    px_min_x = int(np.clip((x_min_b - g_min[0]) / (g_max[0] - g_min[0]) * img_w, 0, img_w))
    px_max_x = int(np.clip((x_max_b - g_min[0]) / (g_max[0] - g_min[0]) * img_w, 0, img_w))
    # Add margin
    px_min_x = max(0, px_min_x - 10)
    px_max_x = min(img_w, px_max_x + 10)

    # Remap UVs local to the cropped texture
    u_min_local = (px_min_x / img_w)
    u_max_local = (px_max_x / img_w)
    char_uvs[:, 0] = (char_uvs[:, 0] - u_min_local) / (u_max_local - u_min_local)

    char_crop = img.crop((px_min_x, 0, px_max_x, img_h))
    crop_path = f"assets/avatars/{name}_tex.png"
    char_crop.save(crop_path, "PNG")

    # Read texture bytes to embed into GLB
    with open(crop_path, "rb") as tf:
        tex_bytes = tf.read()

    # Pad buffers to 4-byte boundaries
    pos_bytes = char_verts.tobytes()
    norm_bytes = char_normals.tobytes()
    uv_bytes = char_uvs.tobytes()
    idx_bytes = char_tris_remapped.tobytes()

    def pad4(b):
        pad = (4 - (len(b) % 4)) % 4
        return b + b'\x00' * pad

    b_idx = pad4(idx_bytes)
    b_pos = pad4(pos_bytes)
    b_norm = pad4(norm_bytes)
    b_uv = pad4(uv_bytes)
    b_tex = pad4(tex_bytes)

    total_bin = b_idx + b_pos + b_norm + b_uv + b_tex

    o_idx = 0
    o_pos = len(b_idx)
    o_norm = o_pos + len(b_pos)
    o_uv = o_norm + len(b_norm)
    o_tex = o_uv + len(b_uv)

    # Build GLTF JSON
    num_verts = len(char_verts)
    num_indices = len(char_tris_remapped.flatten())

    gltf_json = {
        "asset": {"version": "2.0", "generator": "FriendShowdown-GLB-Exporter"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": name}],
        "meshes": [{
            "name": name,
            "primitives": [{
                "attributes": {
                    "POSITION": 1,
                    "NORMAL": 2,
                    "TEXCOORD_0": 3
                },
                "indices": 0,
                "material": 0,
                "mode": 4
            }]
        }],
        "materials": [{
            "name": f"{name}_mat",
            "pbrMetallicRoughness": {
                "baseColorTexture": {"index": 0},
                "metallicFactor": 0.1,
                "roughnessFactor": 0.5
            },
            "doubleSided": True
        }],
        "textures": [{"source": 0, "sampler": 0}],
        "images": [{"bufferView": 4, "mimeType": "image/png"}],
        "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 10497, "wrapT": 10497}],
        "accessors": [
            # 0: indices
            {
                "bufferView": 0,
                "componentType": 5125, # UNSIGNED_INT
                "count": num_indices,
                "type": "SCALAR",
                "min": [int(char_tris_remapped.min())],
                "max": [int(char_tris_remapped.max())]
            },
            # 1: positions
            {
                "bufferView": 1,
                "componentType": 5126, # FLOAT
                "count": num_verts,
                "type": "VEC3",
                "min": [float(x) for x in char_verts.min(axis=0)],
                "max": [float(x) for x in char_verts.max(axis=0)]
            },
            # 2: normals
            {
                "bufferView": 2,
                "componentType": 5126,
                "count": num_verts,
                "type": "VEC3"
            },
            # 3: uvs
            {
                "bufferView": 3,
                "componentType": 5126,
                "count": num_verts,
                "type": "VEC2"
            }
        ],
        "bufferViews": [
            {"buffer": 0, "byteOffset": o_idx, "byteLength": len(idx_bytes), "target": 34963}, # ELEMENT_ARRAY_BUFFER
            {"buffer": 0, "byteOffset": o_pos, "byteLength": len(pos_bytes), "target": 34962}, # ARRAY_BUFFER
            {"buffer": 0, "byteOffset": o_norm, "byteLength": len(norm_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": o_uv, "byteLength": len(uv_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": o_tex, "byteLength": len(tex_bytes)}
        ],
        "buffers": [{"byteLength": len(total_bin)}]
    }

    json_str = json.dumps(gltf_json)
    json_bytes = json_str.encode('utf-8')
    # Pad JSON chunk to 4-byte boundary with spaces (0x20)
    json_pad = (4 - (len(json_bytes) % 4)) % 4
    json_bytes += b' ' * json_pad

    # Assemble GLB
    header = struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(json_bytes) + 8 + len(total_bin))
    chunk0_hdr = struct.pack('<II', len(json_bytes), 0x4E4F534A) # JSON
    chunk1_hdr = struct.pack('<II', len(total_bin), 0x004E4942)   # BIN

    out_path = f"assets/models/{name}.glb"
    with open(out_path, "wb") as out_f:
        out_f.write(header)
        out_f.write(chunk0_hdr)
        out_f.write(json_bytes)
        out_f.write(chunk1_hdr)
        out_f.write(total_bin)

    print(f"Generated {out_path}: {num_verts} verts, {num_indices//3} tris, file size={os.path.getsize(out_path)/1024:.1f} KB")

for name, x_min_b, x_max_b in splits:
    export_character_glb(name, x_min_b, x_max_b)
