import haxballgym
import time

game = haxballgym.game.Game(folder_rec="./recordings/")
env = haxballgym.make(game=game)

ep_reward = 0

while True:
    save_rec = False
    if (abs(ep_reward) > 1):
        save_rec = True
    obs = env.reset(save_recording=save_rec)
    obs_1 = obs[0]
    obs_2 = obs[1]
    done = False
    steps = 0
    ep_reward = 0
    t0 = time.time()
    while not done:
        actions_1 = env.action_space.sample()
        actions_2 = env.action_space.sample()
        actions = [actions_1, actions_2]
        new_obs, reward, done, state = env.step(actions)
        ep_reward += reward[0]
        obs_1 = new_obs[0]
        obs_2 = new_obs[1]
        steps += 1

    length = time.time() - t0
    print("Step time: {:1.5f} | Episode time: {:.2f} | Episode Reward: {:.2f}".format(length / steps, length, ep_reward))
    print(f"Final game time: {env._match._game.score.time} | Final ball position: {env._match._game.stadium_game.discs[0].position}\n" + \
        f"Final red player position: {env._match._game.players[0].disc.position} | Final blue player position: {env._match._game.players[1].disc.position}")