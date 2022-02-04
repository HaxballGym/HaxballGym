from typing import Tuple
import numpy as np

from haxballgym.game.objects.base import Disc, Vertex, Segment, Plane
from haxballgym.game.objects import Stadium


def resolve_disc_disc_collision(disc_a: Disc, disc_b: Disc) -> None:
    """
    Resolves the collision between two discs
    """
    dist = np.linalg.norm(disc_a.position - disc_b.position)
    radius_sum = disc_a.radius + disc_b.radius
    if (0 < dist <= radius_sum):
        normal = (disc_a.position - disc_b.position) / dist
        mass_factor = disc_a.inverse_mass / (disc_a.inverse_mass + disc_b.inverse_mass)
        disc_a.position += normal * (radius_sum - dist) * mass_factor
        disc_b.position -= normal * (radius_sum - dist) * (1 - mass_factor)
        relative_velocity = disc_a.velocity - disc_b.velocity
        normal_velocity = np.dot(relative_velocity, normal)
        if (normal_velocity < 0):
            bouncing_factor = -(1 + disc_a.bouncing_coefficient * disc_b.bouncing_coefficient)
            disc_a.velocity += normal * normal_velocity * bouncing_factor * mass_factor
            disc_b.velocity -= normal * normal_velocity * bouncing_factor * (1 - mass_factor)
            
    return


def resolve_disc_vertex_collision(disc: Disc, vertex: Vertex) -> None:
    """
    Resolves the collision between a disc and a vertex
    """
    dist = np.linalg.norm(disc.position - vertex.position)
    if (0 < dist <= disc.radius):
        normal = (disc.position - vertex.position) / dist
        disc.position += normal * (disc.radius - dist)
        normal_velocity = np.dot(disc.velocity, normal)
        if (normal_velocity < 0):
            bouncing_factor = -(1 + disc.bouncing_coefficient * vertex.bouncing_coefficient)
            disc.velocity += normal * normal_velocity * bouncing_factor
            
    return


def segment_apply_bias(segment: Segment, dist: float, normal: np.ndarray) -> Tuple[float, np.ndarray]:
    """
    Applies the bias property during the collision between a segment and a disc
    """
    bias_segment = segment.bias
    if (bias_segment == 0):
        if (dist < 0):
            dist = -dist
            normal = -normal
    elif (bias_segment < 0):
        bias_segment = -bias_segment
        dist = -dist
        normal = -normal
        if (dist < -bias_segment): return np.Infinity, normal
    
    return dist, normal
     
       
def resolve_disc_segment_collision_no_curve(disc: Disc, segment: Segment) -> Tuple[float, np.ndarray]:
    normal_segment = segment.vertices[1].position - segment.vertices[0].position
    normal_disc_v0 = disc.position - segment.vertices[0].position
    normal_disc_v1 = disc.position - segment.vertices[1].position
    if (np.dot(normal_segment, normal_disc_v0) > 0 and np.dot(normal_segment, normal_disc_v1) < 0):
        normal = [normal_segment[1], -normal_segment[0]] / np.linalg.norm(normal_segment)
        dist = np.dot(normal, normal_disc_v1)
        
        return dist, normal
    
    return None, None


def resolve_disc_segment_collision_curve(disc: Disc, segment: Segment) -> Tuple[float, np.ndarray]:
    normal_circle = disc.position - segment.circle_center
    if (
        (np.dot(normal_circle, segment.circle_tangeant[0]) > 0 and
         np.dot(normal_circle, segment.circle_tangeant[1]) > 0) != (segment.curve < 0)
    ):
        dist_norm = np.linalg.norm(normal_circle)
        if dist_norm > 0:
            dist = dist_norm - segment.circle_radius
            normal = normal_circle / dist_norm
        
        return dist, normal
    
    return None, None


def resolve_disc_segment_collision(disc: Disc, segment: Segment) -> None:
    """
    Resolves the collision between a disc and a segment
    """
    if (segment.curve == 0):
        dist, normal = resolve_disc_segment_collision_no_curve(disc, segment)
    else:
        dist, normal = resolve_disc_segment_collision_curve(disc, segment)
    
    if (dist is not None and normal is not None):
        dist, normal = segment_apply_bias(segment, dist, normal)
    
        if (dist < disc.radius):
            disc.position += normal * (disc.radius - dist)
            normal_velocity = np.dot(disc.velocity, normal)
            if (normal_velocity < 0):
                bouncing_factor = -(1 + disc.bouncing_coefficient * segment.bouncing_coefficient)
                disc.velocity += normal * normal_velocity * bouncing_factor
    
    return


def resolve_disc_plane_collision(disc: Disc, plane: Plane) -> None:
    """
    Resolves the collision between a disc and a plane
    """
    norm_plane = plane.normal / np.linalg.norm(plane.normal)
    dist = plane.distance_origin - np.dot(disc.position, norm_plane) + disc.radius
    if (dist > 0):
        disc.position += norm_plane * dist
        normal_velocity = np.dot(disc.velocity, norm_plane)
        if (normal_velocity < 0):
            bouncing_factor = -(1 + disc.bouncing_coefficient * plane.bouncing_coefficient)
            disc.velocity += plane.normal * normal_velocity * bouncing_factor


def resolve_collisions(stadium_game: Stadium) -> None:
    '''
    Function that resolves the collisions between the discs and the other objects
    '''
    for i in range(len(stadium_game.discs)):
            d_a = stadium_game.discs[i]
            for j in range(i + 1, len(stadium_game.discs)):
                d_b = stadium_game.discs[j]
                if (((d_a.collision_group & d_b.collision_mask) != 0) and ((d_a.collision_mask & d_b.collision_group) != 0)):
                    resolve_disc_disc_collision(d_a, d_b)
            if (d_a.inverse_mass != 0):
                for p in stadium_game.planes:
                    if (((d_a.collision_group & p.collision_mask) != 0) and ((d_a.collision_mask & p.collision_group) != 0)):
                        resolve_disc_plane_collision(d_a, p)
                for s in stadium_game.segments:
                    if (((d_a.collision_group & s.collision_mask) != 0) and ((d_a.collision_mask & s.collision_group) != 0)):
                        resolve_disc_segment_collision(d_a, s)
                for v in stadium_game.vertices:
                    if (((d_a.collision_group & v.collision_mask) != 0) and ((d_a.collision_mask & v.collision_group) != 0)):
                        resolve_disc_vertex_collision(d_a, v)


def update_discs(stadium_game: Stadium) -> None:
    '''
    Function that updates the position and velocity of the discs
    '''
    for disc in stadium_game.discs:
        disc.position += disc.velocity
        disc.velocity *= disc.damping
