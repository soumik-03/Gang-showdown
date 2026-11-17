import os, struct, json
import numpy as np

# 16-Bone Humanoid Skeleton definition
# (name, parent_name, world_start, world_end)
BONES_DEF = [
    # Core
    ("pelvis",    None,        np.array([ 0.00, 1.45,  0.00]), np.array([ 0.00, 1.80,  0.00])),
    ("spine",     "pelvis",    np.array([ 0.00, 1.80,  0.00]), np.array([ 0.00, 2.15,  0.00])),
    ("chest",     "spine",     np.array([ 0.00, 2.15,  0.00]), np.array([ 0.00, 2.45,  0.00])),
    ("head",      "chest",     np.array([ 0.00, 2.45,  0.00]), np.array([ 0.00, 3.20,  0.00])),
    # Left Arm (character's left is X < 0 in our coordinate setup)
    ("shoulder_l","chest",     np.array([-0.35, 2.30,  0.00]), np.array([-0.65, 2.25,  0.00])),
    ("arm_l",     "shoulder_l",np.array([-0.65, 2.25,  0.00]), np.array([-0.85, 1.70,  0.00])),
    ("forearm_l", "arm_l",     np.array([-0.85, 1.70,  0.00]), np.array([-1.05, 1.15,  0.00])),
    # Right Arm (character's right is X > 0)
    ("shoulder_r","chest",     np.array([ 0.35, 2.30,  0.00]), np.array([ 0.65, 2.25,  0.00])),
    ("arm_r",     "shoulder_r",np.array([ 0.65, 2.25,  0.00]), np.array([ 0.85, 1.70,  0.00])),
    ("forearm_r", "arm_r",     np.array([ 0.85, 1.70,  0.00]), np.array([ 1.05, 1.15,  0.00])),
    # Left Leg (X < 0)
    ("thigh_l",   "pelvis",    np.array([-0.35, 1.45,  0.00]), np.array([-0.35, 0.75,  0.00])),
    ("calf_l",    "thigh_l",   np.array([-0.35, 0.75,  0.00]), np.array([-0.35, 0.20,  0.00])),
    ("foot_l",    "calf_l",    np.array([-0.35, 0.20,  0.00]), np.array([-0.35, 0.00,  0.25])),
    # Right Leg (X > 0)
    ("thigh_r",   "pelvis",    np.array([ 0.35, 1.45,  0.00]), np.array([ 0.35, 0.75,  0.00])),
    ("calf_r",    "thigh_r",   np.array([ 0.35, 0.75,  0.00]), np.array([ 0.35, 0.20,  0.00])),
    ("foot_r",    "calf_r",    np.array([ 0.35, 0.20,  0.00]), np.array([ 0.35, 0.00,  0.25]))
]

BONE_NAMES = [b[0] for b in BONES_DEF]
BONE_INDEX = {b[0]: i for i, b in enumerate(BONES_DEF)}

def pt_segment_dist(p, a, b):
    ab = b - a
    ab_len_sq = np.sum(ab**2)
    if ab_len_sq == 0:
        return np.linalg.norm(p - a, axis=1)
    ap = p - a
    t = np.clip(np.sum(ap * ab, axis=1) / ab_len_sq, 0.0, 1.0)
    closest = a + t[:, None] * ab
    return np.linalg.norm(p - closest, axis=1)

def compute_skinning_weights(verts):
    n_verts = len(verts)
    n_bones = len(BONES_DEF)
    dist_matrix = np.full((n_verts, n_bones), 999.0, dtype=np.float32)

    vx = verts[:, 0]
    vy = verts[:, 1]

    for i, (name, parent, w_start, w_end) in enumerate(BONES_DEF):
        dist = pt_segment_dist(verts, w_start, w_end)
        
        # Anatomical masking:
        mask = np.ones(n_verts, dtype=bool)
        if 'head' in name:
            mask = (vy >= 2.30)
        elif 'forearm_l' in name:
            mask = (vx <= -0.50) & (vy <= 1.95) & (vy >= 0.8)
        elif 'arm_l' in name:
            mask = (vx <= -0.45) & (vy >= 1.40) & (vy <= 2.45)
        elif 'shoulder_l' in name:
            mask = (vx <= -0.25) & (vy >= 2.05) & (vy <= 2.55)
        elif 'forearm_r' in name:
            mask = (vx >= 0.50) & (vy <= 1.95) & (vy >= 0.8)
        elif 'arm_r' in name:
            mask = (vx >= 0.45) & (vy >= 1.40) & (vy <= 2.45)
        elif 'shoulder_r' in name:
            mask = (vx >= 0.25) & (vy >= 2.05) & (vy <= 2.55)
        elif 'foot_l' in name:
            mask = (vx <= 0.05) & (vy <= 0.35)
        elif 'calf_l' in name:
            mask = (vx <= 0.05) & (vy <= 0.95) & (vy >= 0.10)
        elif 'thigh_l' in name:
            mask = (vx <= 0.05) & (vy <= 1.55) & (vy >= 0.60)
        elif 'foot_r' in name:
            mask = (vx >= -0.05) & (vy <= 0.35)
        elif 'calf_r' in name:
            mask = (vx >= -0.05) & (vy <= 0.95) & (vy >= 0.10)
        elif 'thigh_r' in name:
            mask = (vx >= -0.05) & (vy <= 1.55) & (vy >= 0.60)
        elif 'pelvis' in name:
            mask = (vy <= 1.85) & (vy >= 1.15) & (np.abs(vx) <= 0.55)
        elif 'spine' in name:
            mask = (vy <= 2.20) & (vy >= 1.55) & (np.abs(vx) <= 0.55)
        elif 'chest' in name:
            mask = (vy <= 2.55) & (vy >= 1.90) & (np.abs(vx) <= 0.55)

        dist[~mask] = 999.0
        dist_matrix[:, i] = dist

    # For any vertex that got masked out of all bones (edge cases), find nearest bone unconditionally
    unassigned = np.all(dist_matrix >= 990.0, axis=1)
    if np.any(unassigned):
        for i, (name, parent, w_start, w_end) in enumerate(BONES_DEF):
            dist_matrix[unassigned, i] = pt_segment_dist(verts[unassigned], w_start, w_end)

    # Inverse distance weighting with sharp falloff (power 4 for crisp humanoid articulation)
    inv_dist = 1.0 / (dist_matrix**4 + 1e-4)

    # Pick top 4 bones per vertex
    top4_indices = np.argsort(-inv_dist, axis=1)[:, :4]
    
    top4_weights = np.take_along_axis(inv_dist, top4_indices, axis=1)
    weight_sums = np.sum(top4_weights, axis=1, keepdims=True)
    weight_sums[weight_sums == 0] = 1.0
    top4_weights = (top4_weights / weight_sums).astype(np.float32)

    joints_0 = top4_indices.astype(np.uint16)
    weights_0 = top4_weights

    return joints_0, weights_0

def rig_character_glb(input_path, output_path):
    with open(input_path, 'rb') as f:
        magic, ver, total_len = struct.unpack('<4sII', f.read(12))
        c0_len, c0_type = struct.unpack('<II', f.read(8))
        gltf_json = json.loads(f.read(c0_len).decode('utf-8'))
        c1_len, c1_type = struct.unpack('<II', f.read(8))
        bin_data = f.read(c1_len)

    # Get position accessor
    pos_acc = gltf_json['accessors'][1]
    pos_bv = gltf_json['bufferViews'][pos_acc['bufferView']]
    n_verts = pos_acc['count']
    pos_offset = pos_bv.get('byteOffset', 0)
    verts = np.frombuffer(bin_data[pos_offset:pos_offset + n_verts * 12], dtype=np.float32).reshape(-1, 3)

    # Compute bone weights
    joints_0, weights_0 = compute_skinning_weights(verts)

    # Build node hierarchy:
    # Node 0: Mesh Node (SkinnedMesh)
    # Nodes 1..16: Bones (pelvis..foot_r)
    nodes = []
    
    # 0: SkinnedMesh node
    nodes.append({
        "name": gltf_json['nodes'][0]['name'],
        "mesh": 0,
        "skin": 0
    })

    # Bones hierarchy
    # Calculate local translations for each bone relative to its parent
    bone_node_indices = {}
    for i, (b_name, p_name, w_start, w_end) in enumerate(BONES_DEF):
        node_idx = 1 + i
        bone_node_indices[b_name] = node_idx

    for i, (b_name, p_name, w_start, w_end) in enumerate(BONES_DEF):
        node_idx = 1 + i
        if p_name is None:
            # Root bone relative to world
            local_pos = w_start
        else:
            p_start = [b[2] for b in BONES_DEF if b[0] == p_name][0]
            local_pos = w_start - p_start

        node_dict = {
            "name": b_name,
            "translation": [float(x) for x in local_pos]
        }
        
        # Find children
        children = [bone_node_indices[b[0]] for b in BONES_DEF if b[1] == b_name]
        if children:
            node_dict["children"] = children

        nodes.append(node_dict)

    # Calculate Inverse Bind Matrices (16 4x4 matrices)
    # In bind pose, bone global position is w_start
    # Inverse matrix is translation by -w_start:
    # Column-major 4x4 matrix:
    # [1, 0, 0, 0,
    #  0, 1, 0, 0,
    #  0, 0, 1, 0,
    # -x, -y, -z, 1]
    inv_bind_matrices = np.zeros((len(BONES_DEF), 16), dtype=np.float32)
    for i, (b_name, p_name, w_start, w_end) in enumerate(BONES_DEF):
        mat = np.eye(4, dtype=np.float32)
        mat[3, 0] = -w_start[0]
        mat[3, 1] = -w_start[1]
        mat[3, 2] = -w_start[2]
        inv_bind_matrices[i] = mat.flatten()

    # Append new buffers to bin_data:
    # 1. joints_0 (n_verts * 4 * unsigned short = n_verts * 8 bytes)
    # 2. weights_0 (n_verts * 4 * float = n_verts * 16 bytes)
    # 3. inv_bind_matrices (16 * 16 * float = 1024 bytes)

    def pad4(b):
        pad = (4 - (len(b) % 4)) % 4
        return b + b'\x00' * pad

    b_joints = pad4(joints_0.tobytes())
    b_weights = pad4(weights_0.tobytes())
    b_ibm = pad4(inv_bind_matrices.tobytes())

    old_bin_len = len(bin_data)
    # Ensure old bin_data is 4-byte aligned
    aligned_bin_data = pad4(bin_data)
    offset_joints = len(aligned_bin_data)
    offset_weights = offset_joints + len(b_joints)
    offset_ibm = offset_weights + len(b_weights)

    new_bin_data = aligned_bin_data + b_joints + b_weights + b_ibm

    # Add buffer views
    # bufferView 5: joints_0
    # bufferView 6: weights_0
    # bufferView 7: inv_bind_matrices
    bv_joints_idx = len(gltf_json['bufferViews'])
    gltf_json['bufferViews'].append({
        "buffer": 0,
        "byteOffset": offset_joints,
        "byteLength": len(joints_0.tobytes()),
        "target": 34962 # ARRAY_BUFFER
    })

    bv_weights_idx = bv_joints_idx + 1
    gltf_json['bufferViews'].append({
        "buffer": 0,
        "byteOffset": offset_weights,
        "byteLength": len(weights_0.tobytes()),
        "target": 34962 # ARRAY_BUFFER
    })

    bv_ibm_idx = bv_joints_idx + 2
    gltf_json['bufferViews'].append({
        "buffer": 0,
        "byteOffset": offset_ibm,
        "byteLength": len(inv_bind_matrices.tobytes())
    })

    # Add accessors:
    # accessor 4: JOINTS_0
    acc_joints_idx = len(gltf_json['accessors'])
    gltf_json['accessors'].append({
        "bufferView": bv_joints_idx,
        "componentType": 5123, # UNSIGNED_SHORT
        "count": n_verts,
        "type": "VEC4"
    })

    # accessor 5: WEIGHTS_0
    acc_weights_idx = acc_joints_idx + 1
    gltf_json['accessors'].append({
        "bufferView": bv_weights_idx,
        "componentType": 5126, # FLOAT
        "count": n_verts,
        "type": "VEC4"
    })

    # accessor 6: inverseBindMatrices
    acc_ibm_idx = acc_joints_idx + 2
    gltf_json['accessors'].append({
        "bufferView": bv_ibm_idx,
        "componentType": 5126, # FLOAT
        "count": len(BONES_DEF),
        "type": "MAT4"
    })

    # Update mesh primitive attributes
    gltf_json['meshes'][0]['primitives'][0]['attributes']['JOINTS_0'] = acc_joints_idx
    gltf_json['meshes'][0]['primitives'][0]['attributes']['WEIGHTS_0'] = acc_weights_idx

    # Update nodes and scene
    gltf_json['nodes'] = nodes
    # Scene has node 0 (mesh) and node 1 (pelvis root bone)
    gltf_json['scenes'][0]['nodes'] = [0, 1]

    # Add skin definition
    gltf_json['skins'] = [{
        "inverseBindMatrices": acc_ibm_idx,
        "joints": list(range(1, 1 + len(BONES_DEF))),
        "skeleton": 1
    }]

    # Update buffer 0 byte length
    gltf_json['buffers'][0]['byteLength'] = len(new_bin_data)

    # Encode JSON chunk
    json_bytes = json.dumps(gltf_json).encode('utf-8')
    json_pad = (4 - (len(json_bytes) % 4)) % 4
    json_bytes += b' ' * json_pad

    # Build GLB
    header = struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(json_bytes) + 8 + len(new_bin_data))
    chunk0 = struct.pack('<II', len(json_bytes), 0x4E4F534A) + json_bytes
    chunk1 = struct.pack('<II', len(new_bin_data), 0x004E4942) + new_bin_data

    with open(output_path, 'wb') as out_f:
        out_f.write(header + chunk0 + chunk1)

    print(f"Rigged {output_path} successfully! Size: {os.path.getsize(output_path)/1024:.1f} KB")

for name in ['detective', 'wizard', 'explorer', 'golem']:
    src = f"assets/models/{name}.glb"
    rig_character_glb(src, src)
