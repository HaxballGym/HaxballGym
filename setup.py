from setuptools import setup, find_packages
from setuptools.command.install import install

__version__ = None  # This will get replaced when reading version.py
exec(open('haxballgym/version.py').read())

with open('README.md', 'r') as readme_file:
    long_description = readme_file.read()

setup(
    name='haxballgym',
    packages=find_packages(),
    version=__version__,
    description='A python package for creating a gym environment for Haxball for Reinforcement Learning.',
    long_description=long_description,
    long_description_content_type='text/markdown',
    author='Wazarr',
    url='https://github.com/HaxballGym/HaxballGym',
    install_requires=[
        'gym>=0.17',
        'numpy>=1.19',
        'msgpack>=1.0',
        ],
    license='Apache 2.0',
    license_file='LICENSE',
    keywords=['haxball', 'gym', 'reinforcement-learning'],
    classifiers=[
        'Development Status :: 3 - Alpha',
        'License :: OSI Approved :: Apache Software License',
        'Programming Language :: Python :: 3',
    ],
    package_data={
        'stadiums': [
            'haxballgym/stadiums/*.hbs'
        ]
    }
)
