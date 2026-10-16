#!/usr/bin/env python3
"""
Protocol 0x1162 - Production Runtime v3
Setup script for package installation
"""

from setuptools import setup, find_packages
import os

# Read version
version = "3.0.0"

# Read long description
try:
    with open('PROTOCOL_0x1162_README.md', 'r', encoding='utf-8') as f:
        long_description = f.read()
except:
    long_description = "Protocol 0x1162 - Production Runtime v3: Complete closed-loop agent system"

setup(
    name="protocol-0x1162",
    version=version,
    description="Production-grade agent kernel with enforceable constraints and environmental grounding",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="One2lv Systems",
    author_email="dev@one2lv.io",
    maintainer="One2lv Systems",
    maintainer_email="dev@one2lv.io",
    url="https://github.com/one2lv-com/protocol-0x1162",
    license="MIT",
    packages=["protocol_0x1162"],
    package_dir={"protocol_0x1162": "."},
    py_modules=["protocol_0x1162_runtime_v3"],
    python_requires=">=3.8",
    install_requires=[
        # No external dependencies for core runtime
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "black>=22.0.0",
            "mypy>=0.900",
        ],
        "integrations": [
            "openai>=1.0.0",
            "anthropic>=0.3.0",
        ]
    },
    entry_points={
        "console_scripts": [
            "protocol-0x1162=protocol_0x1162_cli:main",
        ],
    },
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Software Development :: Libraries :: Application Frameworks",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
    keywords="agent ai constraints responsibility causal-reasoning",
    project_urls={
        "Bug Reports": "https://github.com/one2lv-com/protocol-0x1162/issues",
        "Source": "https://github.com/one2lv-com/protocol-0x1162",
        "Documentation": "https://protocol0x1162.one2lv.com",
    },
    include_package_data=True,
    zip_safe=False,
)
