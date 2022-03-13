__version__ = '0.3.1'

release_notes = {
    '0.3.1': """
    - Added 2 new reward functions, VelocityPlayerToBall and VelocityBallToGoal.
    - Added new recorder, which records positions, can be useful for detecting bugs.
    - Edited obs builder to invert x axis if player in blue team, and inverted x player action to have symmetry with red team.
    """,
    '0.3.0': """
    - Fixed bug where the game would desync from js version, due to the player disc not being reset and keeping the same velocity.
    - Added recorder reader to read the recording file and replay it in Python (use of JS is still recommended for now).
    """,
    '0.2.2': """
    - Fixed stadium loading, removed obstacle map because it's currently not supported and added the Big map.
    - Added more debug information.
    - Added better reward functions (EventReward, AlignedReward, VelocityReward, ConstantReward).
    - Critical: I found a misalignment between my clone and the python simulation, I will fix it in the next release.
    """,
    '0.2.1': """
    Fix setup error that made it so we didn't import the stadiums.
    """,
    '0.2.0': """
    Alpha release
    """,
    '0.1.0': """
    Initial Release
    """
}


def get_current_release_notes():
    if __version__ in release_notes:
        return release_notes[__version__]
    return ''


def print_current_release_notes():
    print(f"Version {__version__}")
    print(get_current_release_notes())
    print("")